import { describe, it, expect, vi } from 'vitest';
import { Board } from '../board';
import { Clock } from '../clock';
import { MODE_SOLVABLE } from '../builder';
import { TILES } from '../consts';
import type { Mapping } from '../types';
import { safeGetStone } from '../stone';
import { Challenge } from './challenge';
import { SCORE_COMBO_WINDOW } from './score';
import {
	CHALLENGE_CODES,
	CHALLENGE_IDS,
	CHALLENGE_MAX_TILE_COUNT,
	CHALLENGE_MIN_TILE_COUNT,
	CHALLENGE_PURGE_TIME_PER_BOARD_TILE,
	CHALLENGE_PURGE_TIME_PER_TARGET,
	CHALLENGE_RUNNING_SAND_BONUS,
	CHALLENGE_RUNNING_SAND_MAX_RESERVE,
	CHALLENGE_SPARKSTONE_TIME_PER_TILE,
	challengeFromCode,
	challengeInfo,
	markCode,
	minimumTileCount,
	suitGroupCode,
	suitTargetBounds
} from './consts';

function flatMapping(pairs: number): Mapping {
	const mapping: Mapping = [];
	let placed = 0;
	for (let y = 0; placed < pairs * 2; y += 2) {
		for (let x = 0; x < 36 && placed < pairs * 2; x += 2) {
			mapping.push([0, x, y]);
			placed++;
		}
	}
	return mapping;
}

function stackedMapping(): Mapping {
	const mapping: Mapping = [];
	for (let y = 0; y < 8; y += 2) {
		for (let x = 0; x < 12; x += 2) {
			mapping.push([0, x, y]);
		}
	}
	for (let y = 0; y < 8; y += 2) {
		for (let x = 0; x < 12; x += 2) {
			mapping.push([1, x, y]);
		}
	}
	return mapping;
}

function makeChallenge(id: Parameters<typeof challengeInfo>[0], mapping: Mapping = stackedMapping()): { challenge: Challenge; board: Board; clock: Clock } {
	const board = new Board();
	board.applyMapping(mapping, MODE_SOLVABLE);
	board.update();
	const clock = new Clock();
	const challenge = new Challenge({ id, seed: 'daily-2026-07-30', dayKey: '2026-07-30' }, board, clock);
	challenge.start();
	return { challenge, board, clock };
}

describe('Challenge', () => {
	it('exposes info for every declared challenge', () => {
		for (const id of CHALLENGE_IDS) {
			expect(challengeInfo(id).id).toBe(id);
		}
	});

	it('reports an infinite countdown when the challenge has no time limit', () => {
		const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		expect(challenge.hasTimeLimit).toBe(false);
		expect(challenge.remaining()).toBe(Number.POSITIVE_INFINITY);
	});

	it('counts the countdown down from the time limit', () => {
		const { challenge, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
		expect(challenge.hasTimeLimit).toBe(true);
		const limit = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0;
		expect(challenge.remaining()).toBe(limit);
		clock.elapsed.set(30_000);
		expect(challenge.remaining()).toBe(limit - 30_000);
	});

	// the clock signal only moves once a second, so timing the chain by it stretched the window to ~6s
	it('closes the combo window on the live clock, not on the one-second tick', () => {
		vi.useFakeTimers();
		const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
		try {
			const stones = board.stones();
			clock.run();
			challenge.pick(stones[0], stones[1]);

			vi.advanceTimersByTime(SCORE_COMBO_WINDOW + 500);
			challenge.pick(stones[2], stones[3]);

			expect(clock.elapsed()).toBe(SCORE_COMBO_WINDOW);
			expect(challenge.score.combo()).toBe(0);
		} finally {
			clock.reset();
			vi.useRealTimers();
		}
	});

	it('keeps a chain alive inside the window', () => {
		vi.useFakeTimers();
		const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
		try {
			const stones = board.stones();
			clock.run();
			challenge.pick(stones[0], stones[1]);

			vi.advanceTimersByTime(SCORE_COMBO_WINDOW - 500);
			challenge.pick(stones[2], stones[3]);

			expect(challenge.score.combo()).toBe(1);
		} finally {
			clock.reset();
			vi.useRealTimers();
		}
	});

	it('adds bonus time on top of the limit', () => {
		const { challenge, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
		const limit = challengeInfo(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND).timeLimit ?? 0;
		clock.elapsed.set(10_000);
		challenge.addTime(5000);
		expect(challenge.remaining()).toBe(limit + 5000 - 10_000);
	});

	it('produces the same random sequence for the same seed', () => {
		const board = new Board();
		board.applyMapping(stackedMapping(), MODE_SOLVABLE);
		const build = () => {
			const challenge = new Challenge({ id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'same-seed' }, board, new Clock());
			return [challenge.random(), challenge.random(), challenge.random()];
		};
		expect(build()).toEqual(build());
	});

	it('tracks marks and clears them by kind', () => {
		const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		const stone = board.stones()[0];
		challenge.mark(stone, 'spark');
		expect(challenge.markedStones('spark')).toContain(stone);
		challenge.clearMark('spark');
		expect(challenge.markedStones('spark')).toHaveLength(0);
		expect(challenge.markedStones('midas')).toHaveLength(1);
	});

	it('moves a cached stone between mark kinds', () => {
		const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		const stone = board.stones()[0];
		challenge.mark(stone, 'spark');
		const cached = challenge.markedStones('spark');
		expect(challenge.markedStones('spark')).toBe(cached);

		challenge.mark(stone, 'target');

		expect(challenge.markedStones('spark')).not.toContain(stone);
		expect(challenge.markedStones('target')).toEqual([stone]);
	});

	describe('Midas Match', () => {
		it('marks exactly one tile and never a free one', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
			const midas = challenge.markedStones('midas');
			expect(midas).toHaveLength(1);
			expect(board.free()).not.toContain(midas[0]);
		});

		it('keeps running while the Midas tile is on the board', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
			expect(challenge.evaluate()).toBe('run');
		});

		it('wins as soon as the Midas tile is removed', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
			const midas = challenge.markedStones('midas')[0];
			midas.picked.set(true);
			expect(challenge.evaluate()).toBe('won');
		});

		it('awards a bonus scaled by how much board is left', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
			const midas = challenge.markedStones('midas')[0];
			const partner = board.stones().find(stone => stone !== midas && stone.groupNr === midas.groupNr);
			expect(partner).toBeDefined();
			const before = challenge.score.points();
			challenge.pick(midas, partner!);
			expect(challenge.score.points()).toBeGreaterThan(before + 100);
		});
	});

	describe('Sparkstone', () => {
		it('marks a sparkstone at start', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			expect(challenge.markedStones('spark')).toHaveLength(1);
		});

		it('budgets time per tile of the board', () => {
			const small = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE, flatMapping(10));
			const large = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE, flatMapping(20));
			expect(small.challenge.timeLimit()).toBe(20 * CHALLENGE_SPARKSTONE_TIME_PER_TILE);
			expect(large.challenge.timeLimit()).toBe(40 * CHALLENGE_SPARKSTONE_TIME_PER_TILE);
		});

		it('keeps the budget while the board empties', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			const limit = challenge.timeLimit();
			const stone = board.stones()[0];
			const partner = board.stones().find(other => other !== stone && other.groupNr === stone.groupNr);
			board.pick(stone, partner!);
			expect(challenge.timeLimit()).toBe(limit);
		});

		it('grants time and moves the mark when the sparkstone is matched', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			const spark = challenge.markedStones('spark')[0];
			const partner = board.stones().find(stone => stone !== spark && stone.groupNr === spark.groupNr);
			board.pick(spark, partner!);
			challenge.pick(spark, partner!);
			expect(challenge.timeBonus()).toBe(challengeInfo(CHALLENGE_CODES.CHALLENGE_SPARKSTONE).timeBonus);
			const moved = challenge.markedStones('spark');
			expect(moved).toHaveLength(1);
			expect(moved[0]).not.toBe(spark);
		});

		it('grants no time for an ordinary match', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			const spark = challenge.markedStones('spark')[0];
			const other = board.stones().find(stone => stone.groupNr !== spark.groupNr && !stone.picked());
			const partner = board.stones().find(stone => stone !== other && stone.groupNr === other!.groupNr);
			challenge.pick(other!, partner!);
			expect(challenge.timeBonus()).toBe(0);
		});

		it('loses when the countdown runs out', () => {
			const { challenge, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			expect(challenge.evaluate()).toBe('run');
			clock.elapsed.set(challenge.timeLimit() + 1);
			expect(challenge.evaluate()).toBe('lost');
		});
	});

	describe('Match Attack', () => {
		it('reports progress towards the match target', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
			const target = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).matchTarget;
			expect(challenge.progress()).toEqual({ current: 0, total: target });
		});

		it('wins on the target even with tiles still on the board', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
			const target = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).matchTarget ?? 30;
			const stones = board.stones();
			for (let index = 0; index < target; index++) {
				challenge.pick(stones[0], stones[1]);
			}
			expect(challenge.score.matches()).toBe(target);
			expect(board.count()).toBeGreaterThan(1);
			expect(challenge.evaluate()).toBe('won');
		});

		it('loses when time expires below the target', () => {
			const { challenge, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
			clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
			expect(challenge.evaluate()).toBe('lost');
		});

		it('takes the progress back when a match is undone', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
			const stones = board.stones();
			challenge.pick(stones[0], stones[1]);
			expect(challenge.progress()?.current).toBe(1);

			challenge.undo();

			expect(challenge.progress()?.current).toBe(0);
		});
	});

	describe('Score Attack', () => {
		it('wins when the score target is reached', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT);
			const target = challengeInfo(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT).scoreTarget ?? 5000;
			const stones = board.stones();
			let elapsed = 0;
			while (challenge.score.points() < target) {
				elapsed += 100;
				challenge.score.addMatch(elapsed, 1);
			}
			challenge.pick(stones[0], stones[1]);
			expect(challenge.evaluate()).toBe('won');
		});

		it('loses when time expires below the target', () => {
			const { challenge, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT);
			clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT).timeLimit ?? 0) + 1);
			expect(challenge.evaluate()).toBe('lost');
		});

		it('takes the progress back when a match is undone', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT);
			const stones = board.stones();
			challenge.pick(stones[0], stones[1]);
			expect(challenge.progress()?.current).toBeGreaterThan(0);

			challenge.undo();

			expect(challenge.progress()?.current).toBe(0);
		});
	});

	describe('Running Sand', () => {
		it('grants time for every match', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
			const stones = board.stones();
			challenge.pick(stones[0], stones[1]);
			expect(challenge.timeBonus()).toBeGreaterThanOrEqual(challengeInfo(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND).timeBonus ?? 0);
		});

		it('grants extra time while a combo is alive', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
			const stones = board.stones();
			challenge.pick(stones[0], stones[1]);
			const flat = challenge.timeBonus();
			challenge.pick(stones[2], stones[3]);
			expect(challenge.timeBonus() - flat).toBeGreaterThan(flat);
		});

		it('caps the reserve so a chain cannot bank time', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
			const stones = board.stones();
			for (let index = 0; index + 1 < stones.length; index += 2) {
				challenge.pick(stones[index], stones[index + 1]);
				expect(challenge.remaining()).toBeLessThanOrEqual(CHALLENGE_RUNNING_SAND_MAX_RESERVE);
			}
			expect(challenge.remaining()).toBe(CHALLENGE_RUNNING_SAND_MAX_RESERVE);
		});

		it('grants time again once the reserve has run down', () => {
			const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
			const stones = board.stones();
			for (let index = 0; index < 6; index += 2) {
				challenge.pick(stones[index], stones[index + 1]);
			}
			expect(challenge.remaining()).toBe(CHALLENGE_RUNNING_SAND_MAX_RESERVE);
			clock.elapsed.set(30_000);
			const banked = challenge.timeBonus();
			challenge.pick(stones[6], stones[7]);
			expect(challenge.timeBonus() - banked).toBe(CHALLENGE_RUNNING_SAND_BONUS);
		});
	});

	describe('The Purge', () => {
		it('marks a whole suit and names it', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE);
			expect(challenge.markedStones('target').length).toBeGreaterThan(0);
			expect(challenge.subject()).toBeTruthy();
		});

		it('wins when every marked tile is gone', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE);
			expect(challenge.evaluate()).toBe('run');
			for (const stone of challenge.markedStones('target')) {
				stone.picked.set(true);
			}
			expect(challenge.evaluate()).toBe('won');
		});

		it('loses when time expires with tiles of the suit left', () => {
			const { challenge, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE);
			clock.elapsed.set(challenge.timeLimit() + 1);
			expect(challenge.evaluate()).toBe('lost');
		});

		it('takes the progress back when a match is undone', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE);
			const targets = challenge.markedStones('target');
			expect(targets.length).toBeGreaterThanOrEqual(2);
			for (const stone of targets.slice(0, 2)) {
				stone.picked.set(true);
			}
			challenge.pick(targets[0], targets[1]);
			expect(challenge.progress()?.current).toBe(2);

			// the board un-picks the pair before the challenge is told
			for (const stone of targets.slice(0, 2)) {
				stone.picked.set(false);
			}
			challenge.undo();

			expect(challenge.progress()?.current).toBe(0);
		});

		it('scales the countdown with the board size and the number of marked tiles', () => {
			const { challenge, board } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE);
			const targets = challenge.markedStones('target').length;
			const base = board.stones().length * CHALLENGE_PURGE_TIME_PER_BOARD_TILE;
			expect(challenge.timeLimit()).toBe(base + (targets * CHALLENGE_PURGE_TIME_PER_TARGET));
		});

		it('budgets time per tile of the board, not only per target', () => {
			const small = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE, flatMapping(10));
			const large = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE, flatMapping(40));
			const baseOf = (c: typeof small) =>
				c.challenge.timeLimit() - (c.challenge.markedStones('target').length * CHALLENGE_PURGE_TIME_PER_TARGET);
			expect(baseOf(small)).toBe(20 * CHALLENGE_PURGE_TIME_PER_BOARD_TILE);
			expect(baseOf(large)).toBe(80 * CHALLENGE_PURGE_TIME_PER_BOARD_TILE);
		});

		it('gives a small suit group less time than a large one', () => {
			const limits = new Map<number, number>();
			for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
				const board = new Board();
				board.applyMapping(stackedMapping(), MODE_SOLVABLE);
				board.update();
				const challenge = new Challenge({ id: CHALLENGE_CODES.CHALLENGE_THE_PURGE, seed }, board, new Clock());
				challenge.start();
				limits.set(challenge.markedStones('target').length, challenge.timeLimit());
			}
			const sizes = Array.from(limits.keys()).sort((a, b) => a - b);
			expect(sizes.length).toBeGreaterThan(1);
			expect(limits.get(sizes[0])!).toBeLessThan(limits.get(sizes.at(-1)!)!);
		});
	});

	describe('Blackout', () => {
		it('keeps hints but withholds undo, which would re-cover seen tiles', () => {
			const info = challengeInfo(CHALLENGE_CODES.CHALLENGE_BLACKOUT);
			expect(info.allowHint).toBe(true);
			expect(info.allowUndo).toBe(false);
		});

		it('leaves the verdict to the board', () => {
			const { challenge } = makeChallenge(CHALLENGE_CODES.CHALLENGE_BLACKOUT, flatMapping(4));
			expect(challenge.evaluate()).toBe('run');
		});
	});

	describe('save and restore', () => {
		it('round-trips score, bonus time and marks', () => {
			const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			challenge.addTime(7000);
			challenge.score.addMatch(1000, 1);
			const store = challenge.save();
			expect(store.code).toBe(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			expect(store.dayKey).toBe('2026-07-30');
			expect(store.marks).toHaveLength(1);

			const restored = new Challenge({ id: challengeFromCode(store.code)!, seed: store.seed, dayKey: store.dayKey }, board, clock);
			for (const stone of board.stones()) {
				stone.mark.set(undefined);
			}
			restored.restore(store);
			expect(restored.score.points()).toBe(challenge.score.points());
			expect(restored.score.matches()).toBe(challenge.score.matches());
			expect(restored.timeBonus()).toBe(7000);
			expect(restored.markedStones('spark')).toHaveLength(1);
		});

		it('round-trips a live combo chain, so pausing does not cost the multiplier', () => {
			const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND);
			const stones = board.stones();
			clock.elapsed.set(1000);
			challenge.pick(stones[0], stones[1]);
			clock.elapsed.set(2000);
			challenge.pick(stones[2], stones[3]);
			expect(challenge.score.combo()).toBe(1);
			const store = challenge.save();

			const restored = new Challenge({ id: challengeFromCode(store.code)!, seed: store.seed }, board, clock);
			restored.restore(store);

			expect(restored.score.combo()).toBe(1);
			clock.elapsed.set(3000);
			restored.pick(stones[4], stones[5]);
			expect(restored.score.combo()).toBe(2);
		});

		it('restores progress for a target challenge', () => {
			const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
			const stones = board.stones();
			challenge.pick(stones[0], stones[1]);
			challenge.pick(stones[2], stones[3]);
			const store = challenge.save();
			const restored = new Challenge({ id: challengeFromCode(store.code)!, seed: store.seed }, board, clock);
			restored.restore(store);
			expect(restored.progress()?.current).toBe(2);
		});

		it('stores the purge suit as a code and restores its translation key', () => {
			const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_THE_PURGE);
			const subject = challenge.subject();
			const store = challenge.save();
			expect(store.suit).toBe(suitGroupCode(subject!));

			const restored = new Challenge({ id: CHALLENGE_CODES.CHALLENGE_THE_PURGE, seed: store.seed }, board, clock);
			restored.restore(store);
			expect(restored.subject()).toBe(subject);
		});

		it('stores marks as codes and drops any code it does not know', () => {
			const { challenge, board, clock } = makeChallenge(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
			const store = challenge.save();
			expect(store.marks?.[0][3]).toBe(markCode('spark'));

			const [z, x, y] = store.marks![0];
			const restored = new Challenge({ id: CHALLENGE_CODES.CHALLENGE_SPARKSTONE, seed: store.seed }, board, clock);
			for (const stone of board.stones()) {
				stone.mark.set(undefined);
			}
			restored.restore({ ...store, marks: [[z, x, y, 99]] });
			expect(safeGetStone(board.stones(), z, x, y)?.mark()).toBeUndefined();
		});
	});
});

describe('suitTargetBounds', () => {
	it('spans the smallest and the largest suit group of a full board', () => {
		expect(suitTargetBounds(CHALLENGE_MAX_TILE_COUNT)).toEqual({ min: 8, max: 36 });
	});

	it('never claims more targets than a board has places', () => {
		expect(suitTargetBounds(4)).toEqual({ min: 4, max: 4 });
	});
});

describe('minimumTileCount', () => {
	it('demands headroom above a match target', () => {
		expect(minimumTileCount(challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE))).toBe(90);
	});

	it('demands the tiles a score target needs from a player who never chains', () => {
		expect(minimumTileCount(challengeInfo(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT))).toBe(100);
	});

	it('still demands the global floor from a challenge with no target', () => {
		expect(minimumTileCount(challengeInfo(CHALLENGE_CODES.CHALLENGE_BLACKOUT))).toBe(CHALLENGE_MIN_TILE_COUNT);
	});

	it('caps the daily at a full mahjong set, so no board needs jokers', () => {
		expect(CHALLENGE_MAX_TILE_COUNT).toBe(TILES.length * 4);
		expect(CHALLENGE_MAX_TILE_COUNT).toBeGreaterThan(CHALLENGE_MIN_TILE_COUNT);
		for (const id of CHALLENGE_IDS) {
			expect(minimumTileCount(challengeInfo(id))).toBeLessThanOrEqual(CHALLENGE_MAX_TILE_COUNT);
		}
	});

	it('keeps the global floor below every target-derived minimum', () => {
		for (const id of CHALLENGE_IDS) {
			expect(minimumTileCount(challengeInfo(id))).toBeGreaterThanOrEqual(CHALLENGE_MIN_TILE_COUNT);
		}
	});
});
