import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Game, type ChallengeOutcome } from './game';
import { STATES, GAME_MODE_CHALLENGE, GAME_MODE_EASY, GAME_MODE_STANDARD } from './consts';
import { MODE_SOLVABLE } from './builder';
import type { Stone } from './stone';
import type { GameStateStore, Layout, LayoutScoreStore, Mapping, Place, StorageProvider } from './types';
import {
	CHALLENGE_CODES,
	challengeInfo
} from './challenge/consts';

function stackedMapping(): Mapping {
	const mapping: Mapping = [];
	for (let z = 0; z < 2; z++) {
		for (let y = 0; y < 8; y += 2) {
			for (let x = 0; x < 12; x += 2) {
				mapping.push([z, x, y]);
			}
		}
	}
	return mapping;
}

function layout(): Layout {
	return { id: 'test-layout', name: 'Test', category: 'Test', mapping: stackedMapping() };
}

// every tile stands clear of its neighbours, so the board can be matched away in any order
function openLayout(pairs: number): Layout {
	const mapping: Mapping = Array.from({ length: pairs * 2 }, (_value, index): Place => [0, index * 4, 0]);
	return { id: 'open-layout', name: 'Open', category: 'Test', mapping };
}

function clearBoard(game: Game): void {
	while (game.board.count() > 0) {
		const free = game.board.free();
		const first = free[0];
		const partner = free.find(stone => stone !== first && stone.groupNr === first?.groupNr);
		if (!first || !partner) {
			throw new Error('open layout should always offer a free pair');
		}
		game.click(first);
		game.click(partner);
	}
}

// matches the marked pair over and over and reports where the mark landed each time
function chaseSpark(game: Game, rounds: number): Array<string> {
	const places: Array<string> = [];
	for (let round = 0; round < rounds; round++) {
		const challenge = game.challenge()!;
		const spark = challenge.markedStones('spark')[0];
		const partner = game.board.stones().find(stone => stone !== spark && stone.groupNr === spark.groupNr && !stone.picked())!;
		game.board.pick(spark, partner);
		challenge.pick(spark, partner);
		const next = challenge.markedStones('spark')[0];
		places.push(`${next.z}/${next.x}/${next.y}`);
	}
	return places;
}

// the Midas pair would end the run, so an undo test needs an ordinary free pair
function freePair(game: Game): [Stone, Stone] {
	const marked = new Set(game.challenge()?.markedStones('midas'));
	const free = game.board.stones().filter(stone => !stone.picked() && !stone.isBlocked() && !marked.has(stone));
	for (const stone of free) {
		const partner = free.find(other => other !== stone && other.groupNr === stone.groupNr);
		if (partner) {
			return [stone, partner];
		}
	}
	throw new Error('no free pair on the test layout');
}

describe('Game with a challenge', () => {
	let game: Game;
	let stored: GameStateStore | undefined;
	let scores: Map<string, LayoutScoreStore>;
	let storage: StorageProvider;

	beforeEach(() => {
		stored = undefined;
		scores = new Map<string, LayoutScoreStore>();
		storage = {
			getState: () => stored,
			storeState: (store?: GameStateStore) => {
				stored = store;
			},
			getScore: (id: string) => scores.get(id),
			storeScore: (id: string, store?: LayoutScoreStore) => {
				if (store) {
					scores.set(id, store);
				}
			},
			getSettings: () => undefined,
			storeSettings: () => undefined
		};
		game = new Game(storage);
	});

	// a challenge starts the clock, so every test would otherwise leave a 1s timer chain running
	afterEach(() => {
		game.destroy();
	});

	it('starts without a challenge by default', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD);
		expect(game.challenge()).toBeUndefined();
	});

	it('sets up the challenge and marks the Midas tile on start', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'daily-2026-07-30', dayKey: '2026-07-30' });
		const challenge = game.challenge();
		expect(challenge).toBeDefined();
		expect(challenge?.markedStones('midas')).toHaveLength(1);
		expect(game.state()).toBe(STATES.run);
	});

	it('runs the clock from the start of a challenge instead of the first tile', () => {
		vi.useFakeTimers();
		try {
			game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
			expect(game.clock.elapsed()).toBe(0);
			vi.advanceTimersByTime(2000);
			expect(game.clock.elapsed()).toBeGreaterThan(0);
		} finally {
			game.clock.reset();
			vi.useRealTimers();
		}
	});

	it('leaves the clock to the first tile in an ordinary game', () => {
		vi.useFakeTimers();
		try {
			game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD);
			vi.advanceTimersByTime(2000);
			expect(game.clock.elapsed()).toBe(0);
		} finally {
			game.clock.reset();
			vi.useRealTimers();
		}
	});

	it('withholds undo and shuffle in Blackout but keeps the hint', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_BLACKOUT, seed: 'seed' });
		const hintSpy = vi.spyOn(game.board, 'hint');
		const backSpy = vi.spyOn(game.board, 'back');
		const shuffleSpy = vi.spyOn(game.board, 'shuffle');
		expect(game.back()).toBe(false);
		expect(game.shuffle()).toBe(false);
		expect(backSpy).not.toHaveBeenCalled();
		expect(shuffleSpy).not.toHaveBeenCalled();
		expect(game.hint()).toBe(true);
		expect(hintSpy).toHaveBeenCalled();
	});

	it('reports what the challenge withholds, so the controls can drop those buttons', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_BLACKOUT, seed: 'seed' });
		expect(game.allowsUndo()).toBe(false);
		expect(game.allowsHint()).toBe(true);

		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		expect(game.allowsUndo()).toBe(true);
		expect(game.allowsHint()).toBe(true);

		game.reset();
		// an ordinary game withholds nothing the mode itself allows
		expect(game.allowsUndo()).toBe(true);
		expect(game.allowsHint()).toBe(true);
	});

	// the board hides its tiles while a timed challenge is paused, so stopping the clock buys no free study time
	it('pauses a timed challenge on demand', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });

		game.toggle();

		expect(game.state()).toBe(STATES.pause);
	});

	it('keeps pause for a challenge without a countdown', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });

		game.toggle();

		expect(game.state()).toBe(STATES.pause);
	});

	it('resumes a timed challenge that something else paused', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		game.pause();
		expect(game.state()).toBe(STATES.pause);

		game.toggle();

		expect(game.state()).toBe(STATES.run);
	});

	it('runs a challenge under its own rules while keeping the chosen difficulty', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_EASY, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });

		// the easy mode affordances key off the rule mode, so a challenge cannot reach any of them
		expect(game.ruleMode()).toBe(GAME_MODE_CHALLENGE);
		expect(game.allowsShuffle()).toBe(false);
		// the difficulty the player picked survives the run, since it is what the picker shows next
		expect(game.mode()).toBe(GAME_MODE_EASY);

		game.reset();
		expect(game.ruleMode()).toBe(GAME_MODE_EASY);
		expect(game.allowsShuffle()).toBe(true);
	});

	it('never persists the challenge rule mode as a difficulty', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_EASY, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		game.save();

		// the stored mode seeds the board picker on the next launch, and GAME_MODE_CHALLENGE is not selectable
		expect(stored?.gameMode).toBe(GAME_MODE_EASY);

		const restoredGame = new Game(storage);
		expect(restoredGame.load()).toBe(true);
		expect(restoredGame.mode()).toBe(GAME_MODE_EASY);
		expect(restoredGame.ruleMode()).toBe(GAME_MODE_CHALLENGE);
		expect(restoredGame.allowsShuffle()).toBe(false);
		restoredGame.destroy();
	});

	it('reports the plain difficulty again once the challenge is gone', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_EASY, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		game.save();
		// a save written after the run ended carries the difficulty and no challenge
		stored = { ...stored!, challenge: undefined };

		const restoredGame = new Game(storage);
		expect(restoredGame.load()).toBe(true);
		expect(restoredGame.ruleMode()).toBe(GAME_MODE_EASY);
		expect(restoredGame.allowsShuffle()).toBe(true);
		restoredGame.destroy();
	});

	it('never offers the deadlock rescue during a challenge', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_EASY, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		// a deadlock with tiles to spare, which is what the easy mode rescue exists for
		vi.spyOn(game.board, 'free').mockReturnValue([]);
		vi.spyOn(game.board, 'countUnblocked').mockReturnValue(4);
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};

		game.checkGameState();

		expect(game.message()?.askShuffle).toBeUndefined();
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(false);
	});

	it('still offers the deadlock rescue to an ordinary easy mode game', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_EASY);
		vi.spyOn(game.board, 'free').mockReturnValue([]);
		vi.spyOn(game.board, 'countUnblocked').mockReturnValue(4);

		game.checkGameState();

		expect(game.message()?.askShuffle).toBe(true);
		expect(game.state()).toBe(STATES.pause);
	});

	describe('a daily the calendar rolled past', () => {
		function saveYesterdaysRun(): void {
			game.now = () => new Date(2026, 7, 14);
			game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed', dayKey: '2026-08-14' });
			game.challenge()!.score.addMatch(1000, 1);
			game.save();
			expect(stored?.challenge?.dayKey).toBe('2026-08-14');
			game.destroy();
		}

		it('banks the run as a loss against its own day and says so', () => {
			saveYesterdaysRun();
			const nextDay = new Game(storage);
			nextDay.now = () => new Date(2026, 7, 15);
			const outcomes: Array<ChallengeOutcome> = [];
			nextDay.onChallengeEnd = outcome => {
				outcomes.push(outcome);
			};

			nextDay.init();
			expect(nextDay.expireStaleDaily()).toBe(true);

			expect(outcomes).toHaveLength(1);
			expect(outcomes[0].won).toBe(false);
			// banked against the day it was played, not the day it expired
			expect(outcomes[0].challenge.dayKey).toBe('2026-08-14');
			expect(outcomes[0].challenge.score.points()).toBeGreaterThan(0);
			expect(nextDay.message()?.messageID).toBe('MSG_DAILY_EXPIRED');
			expect(nextDay.challenge()).toBeUndefined();
			nextDay.destroy();
		});

		it('refuses to resume yesterday, and only drops the save once the run is banked', () => {
			saveYesterdaysRun();
			const nextDay = new Game(storage);
			nextDay.now = () => new Date(2026, 7, 15);

			expect(nextDay.load()).toBe(false);
			expect(nextDay.challenge()).toBeUndefined();
			// still on disk: clearing it before the attempt is banked would lose the attempt
			expect(stored?.challenge?.dayKey).toBe('2026-08-14');

			expect(nextDay.expireStaleDaily()).toBe(true);

			expect(stored).toBeUndefined();
			nextDay.destroy();
		});

		it('reports nothing when there is no expired run', () => {
			expect(game.expireStaleDaily()).toBe(false);
			expect(game.message()).toBeUndefined();
		});

		it('expires only once, however often it is asked', () => {
			saveYesterdaysRun();
			const nextDay = new Game(storage);
			nextDay.now = () => new Date(2026, 7, 15);
			const outcomes: Array<ChallengeOutcome> = [];
			nextDay.onChallengeEnd = outcome => {
				outcomes.push(outcome);
			};
			nextDay.init();

			expect(nextDay.expireStaleDaily()).toBe(true);
			expect(nextDay.expireStaleDaily()).toBe(false);

			expect(outcomes).toHaveLength(1);
			nextDay.destroy();
		});

		it('leaves a run from the same day alone', () => {
			saveYesterdaysRun();
			const sameDay = new Game(storage);
			sameDay.now = () => new Date(2026, 7, 14);

			expect(sameDay.load()).toBe(true);

			expect(sameDay.expireStaleDaily()).toBe(false);
			expect(sameDay.challenge()?.dayKey).toBe('2026-08-14');
			sameDay.destroy();
		});
	});

	it('falls back to the plain difficulty when the saved challenge code is unknown', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		game.save();
		// a save from a build that knows a challenge this one does not
		stored = { ...stored!, challenge: { ...stored!.challenge!, code: 99 } };

		const restoredGame = new Game(storage);
		expect(restoredGame.load()).toBe(true);

		expect(restoredGame.challenge()).toBeUndefined();
		expect(restoredGame.ruleMode()).toBe(GAME_MODE_STANDARD);
		restoredGame.destroy();
	});

	it('loses the easy mode deadlock instead of rescuing a challenge with a shuffle', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_EASY, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const shuffleSpy = vi.spyOn(game.board, 'shuffle');
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};

		game.gameOverEasyModeShuffle();

		expect(shuffleSpy).not.toHaveBeenCalled();
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(false);
	});

	it('counts an abandoned run as a failed attempt', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed', dayKey: '2026-08-14' });
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};

		game.reset();

		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(false);
		expect(outcomes[0].challenge.dayKey).toBe('2026-08-14');
	});

	it('does not count a finished run a second time when the next game resets', () => {
		game.start(openLayout(1), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_BLACKOUT, seed: 'seed', dayKey: '2026-08-14' });
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};

		clearBoard(game);
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(true);

		game.reset();

		expect(outcomes).toHaveLength(1);
	});

	it('reports nothing when an ordinary game resets', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD);
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};

		game.reset();

		expect(outcomes).toHaveLength(0);
	});

	it('allows hint and undo in the Midas tile challenge', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const hintSpy = vi.spyOn(game.board, 'hint');
		expect(game.hint()).toBe(true);
		expect(hintSpy).toHaveBeenCalled();
	});

	it('reports a refused undo when there is nothing on the undo list', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		expect(game.back()).toBe(false);
		const pair = freePair(game);
		game.click(pair[0]);
		game.click(pair[1]);
		expect(game.back()).toBe(true);
	});

	it('takes the score back when a match is undone', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const challenge = game.challenge()!;
		const pair = freePair(game);
		game.click(pair[0]);
		game.click(pair[1]);
		expect(challenge.score.points()).toBeGreaterThan(0);
		expect(challenge.score.matches()).toBe(1);
		game.back();
		expect(challenge.score.points()).toBe(0);
		expect(challenge.score.matches()).toBe(0);
	});

	it('cannot farm points by replaying the same pair through undo', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const challenge = game.challenge()!;
		const pair = freePair(game);
		game.click(pair[0]);
		game.click(pair[1]);
		const once = challenge.score.points();
		for (let index = 0; index < 10; index++) {
			game.back();
			game.click(pair[0]);
			game.click(pair[1]);
		}
		expect(challenge.score.points()).toBe(once);
		expect(challenge.score.matches()).toBe(1);
	});

	it('leaves the score alone when there is nothing to undo', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const challenge = game.challenge()!;
		challenge.score.load({ points: 1234, matches: 7, combo: 0, history: [] });
		game.back();
		expect(challenge.score.points()).toBe(1234);
		expect(challenge.score.matches()).toBe(7);
	});

	it('breaks the score combo when a hint is used', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const challenge = game.challenge()!;
		challenge.score.addMatch(1000, 0);
		challenge.score.addMatch(1200, 0);
		expect(challenge.score.combo()).toBe(1);
		game.hint();
		expect(challenge.score.combo()).toBe(0);
	});

	it('keeps the score combo when a hint is refused on a paused challenge', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const challenge = game.challenge()!;
		challenge.score.addMatch(1000, 0);
		challenge.score.addMatch(1200, 0);
		expect(challenge.score.combo()).toBe(1);

		game.pause();

		expect(game.hint()).toBe(false);
		expect(challenge.score.combo()).toBe(1);
	});

	it('wins the moment the Midas tile pair is removed', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'daily-2026-07-30' });
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};
		const challenge = game.challenge()!;
		const midas = challenge.markedStones('midas')[0];
		const partner = game.board.stones().find(stone => stone !== midas && stone.groupNr === midas.groupNr)!;
		// remove everything blocking, so the pair can actually be taken
		midas.picked.set(true);
		partner.picked.set(true);
		game.board.update();
		game.checkGameState();
		expect(game.message()?.messageID).toBe('MSG_CHALLENGE_WON');
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(true);
	});

	it('wins match attack with tiles left on the board', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		const challenge = game.challenge()!;
		const target = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).matchTarget ?? 30;
		for (let index = 0; index < target; index++) {
			challenge.score.addMatch(index * 100, 0);
		}
		expect(game.board.count()).toBeGreaterThan(1);
		game.checkGameState();
		expect(game.message()?.messageID).toBe('MSG_CHALLENGE_WON');
	});

	it('reports a time-up loss when the countdown expires', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};
		game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
		game.checkGameState();
		expect(game.message()?.messageID).toBe('MSG_TIME_UP');
		expect(outcomes[0].won).toBe(false);
	});

	it('drops the challenge when the countdown runs out', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		game.challenge()!.score.addMatch(1000, 2);
		game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
		game.checkGameState();
		expect(game.message()?.messageID).toBe('MSG_TIME_UP');
		// the hud would otherwise keep counting, from the clock gameOver() has just reset to zero
		expect(game.challenge()).toBeUndefined();
		// the score has to survive the drop, it is all the end message has left to show
		expect(game.message()?.score).toBeGreaterThan(0);
	});

	it('drops the challenge when it is won', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		for (const stone of game.challenge()!.markedStones('midas')) {
			stone.picked.set(true);
		}
		game.checkGameState();
		expect(game.message()?.messageID).toBe('MSG_CHALLENGE_WON');
		expect(game.challenge()).toBeUndefined();
	});

	it('leaves no finished challenge behind for the next load', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
		game.checkGameState();
		expect(stored).toBeDefined();
		expect(stored?.challenge).toBeUndefined();

		const restoredGame = new Game(storage);
		expect(restoredGame.load()).toBe(true);
		expect(restoredGame.challenge()).toBeUndefined();
	});

	it('never writes a per-layout best time for a challenge run', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const challenge = game.challenge()!;
		for (const stone of challenge.markedStones('midas')) {
			stone.picked.set(true);
		}
		game.checkGameState();
		expect(scores.size).toBe(0);
	});

	it('still writes a per-layout best time for an ordinary game', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD);
		for (const stone of game.board.stones()) {
			stone.picked.set(true);
		}
		game.board.update();
		game.checkGameState();
		expect(scores.get('test-layout')?.winCount).toBe(1);
	});

	it('treats a surrender as a challenge loss', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		const outcomes: Array<ChallengeOutcome> = [];
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};
		game.surrender();
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(false);
		expect(scores.size).toBe(0);
	});

	it('persists and restores the challenge across a save cycle', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'daily-2026-07-30', dayKey: '2026-07-30' });
		const midasBefore = game.challenge()!.markedStones('midas')[0];
		game.challenge()!.score.addMatch(1000, 1);
		game.save();
		expect(stored?.challenge?.code).toBe(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);

		const restoredGame = new Game(storage);
		restoredGame.now = () => new Date(2026, 6, 30);
		expect(restoredGame.load()).toBe(true);
		const restored = restoredGame.challenge();
		expect(restored).toBeDefined();
		expect(restored?.dayKey).toBe('2026-07-30');
		expect(restored?.score.points()).toBeGreaterThan(0);
		const midasAfter = restored!.markedStones('midas');
		expect(midasAfter).toHaveLength(1);
		// the mark lands back on the very same place
		expect([midasAfter[0].z, midasAfter[0].x, midasAfter[0].y])
			.toEqual([midasBefore.z, midasBefore.x, midasBefore.y]);
	});

	it('discards a daily saved on an earlier calendar day', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'daily-2026-07-30', dayKey: '2026-07-30' });
		game.save();
		expect(stored?.challenge?.dayKey).toBe('2026-07-30');

		const restoredGame = new Game(storage);
		restoredGame.now = () => new Date(2026, 7, 2);
		expect(restoredGame.load()).toBe(false);
		expect(restoredGame.challenge()).toBeUndefined();
		// the save outlives load() so the attempt can still be banked, and goes with the banking
		expect(restoredGame.expireStaleDaily()).toBe(true);
		expect(stored).toBeUndefined();
		restoredGame.destroy();
	});

	it('carries the sparkstone chain across a reload', () => {
		const setup = { id: CHALLENGE_CODES.CHALLENGE_SPARKSTONE, seed: 'daily-2026-07-30', dayKey: '2026-07-30' } as const;
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, setup);
		const uninterrupted = chaseSpark(game, 4);

		const replay = new Game(storage);
		replay.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, setup);
		expect(chaseSpark(replay, 2)).toEqual(uninterrupted.slice(0, 2));
		replay.save();
		replay.destroy();

		const restoredGame = new Game(storage);
		restoredGame.now = () => new Date(2026, 6, 30);
		expect(restoredGame.load()).toBe(true);
		try {
			// the two draws already spent must not be handed out a second time
			expect(chaseSpark(restoredGame, 2)).toEqual(uninterrupted.slice(2));
		} finally {
			restoredGame.destroy();
		}
	});

	it('loads a legacy save that has no challenge', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD);
		game.save();
		expect(stored?.challenge).toBeUndefined();
		const restoredGame = new Game(storage);
		expect(restoredGame.load()).toBe(true);
		expect(restoredGame.challenge()).toBeUndefined();
	});

	it('clears the challenge on reset', () => {
		game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		game.reset();
		expect(game.challenge()).toBeUndefined();
	});

	it('loses Thirty in Three when the tiles run out below the match target', () => {
		const outcomes: Array<ChallengeOutcome> = [];
		// 10 pairs are 10 matches at most, the target is 30
		game.start(openLayout(10), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed', dayKey: '2026-07-30' });
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};
		clearBoard(game);
		expect(game.message()?.messageID).toBe('MSG_CHALLENGE_LOST');
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(false);
	});

	it('loses Fortune Hunt when the tiles run out below the score target', () => {
		const outcomes: Array<ChallengeOutcome> = [];
		game.start(openLayout(4), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, seed: 'seed', dayKey: '2026-07-30' });
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};
		clearBoard(game);
		expect(game.challenge()).toBeUndefined();
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(false);
		expect(outcomes[0].challenge.score.points()).toBeLessThan(challengeInfo(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT).scoreTarget ?? 0);
	});

	it('still wins a clear-the-board challenge when the tiles run out', () => {
		const outcomes: Array<ChallengeOutcome> = [];
		game.start(openLayout(4), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_SPARKSTONE, seed: 'seed', dayKey: '2026-07-30' });
		game.onChallengeEnd = outcome => {
			outcomes.push(outcome);
		};
		clearBoard(game);
		expect(game.message()?.messageID).toBe('MSG_CHALLENGE_WON');
		expect(outcomes).toHaveLength(1);
		expect(outcomes[0].won).toBe(true);
	});

	it('still wins an ordinary game when the tiles run out', () => {
		game.start(openLayout(4), MODE_SOLVABLE, GAME_MODE_STANDARD);
		clearBoard(game);
		expect(game.state()).toBe(STATES.idle);
		expect(game.message()?.messageID).toBe('MSG_BEST');
	});
});
