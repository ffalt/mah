import { signal } from '@angular/core';
import { Game } from './game';
import type { Board } from './board';
import type { Clock } from './clock';
import { type Sound, SOUNDS } from './sound';
import type { Music } from './music';
import { STATES, GAME_MODE_STANDARD, GAME_MODE_EASY, GAME_MODE_EXPERT, RESCUE_SHUFFLE_ATTEMPTS } from './consts';
import { Stone } from './stone';
import type { GameStateStore, Layout, Place, StonePlace, StorageProvider } from './types';
import { type Mock, describe, beforeEach, it, expect, vi } from 'vitest';

describe('Game', () => {
	let game: Game;
	let mockStorage: StorageProvider;
	let mockBoard: Partial<Board>;
	let mockClock: Partial<Clock>;
	let mockSound: Partial<Sound>;
	let mockMusic: Partial<Music>;

	beforeEach(() => {
		// Create mock storage
		mockStorage = {
			getState: vi.fn(),
			storeState: vi.fn(),
			getScore: vi.fn(),
			storeScore: vi.fn()
		} as unknown as StorageProvider;

		// Create mock board
		mockBoard = {
			update: vi.fn(),
			clearSelection: vi.fn(),
			setStoneSelected: vi.fn(),
			clearHints: vi.fn(),
			hint: vi.fn(),
			shuffle: vi.fn().mockReturnValue(true),
			back: vi.fn(),
			load: vi.fn().mockReturnValue(true),
			save: vi.fn().mockReturnValue([]),
			reset: vi.fn(),
			applyMapping: vi.fn(),
			pick: vi.fn(),
			highlightMatches: vi.fn(),
			clearMatches: vi.fn(),
			selected: undefined,
			count: signal(10),
			free: signal<Array<Stone>>([]),
			countUnblocked: vi.fn().mockReturnValue(0),
			undo: signal<Array<Place>>([])
		};

		// Create mock clock
		mockClock = {
			elapsed: signal(0),
			current: () => mockClock.elapsed!(),
			run: vi.fn(),
			pause: vi.fn(),
			reset: vi.fn()
		};

		// Create mock sound
		mockSound = {
			play: vi.fn()
		};

		// Create mock music
		mockMusic = {
			play: vi.fn(),
			pause: vi.fn()
		};

		game = new Game(mockStorage);
		game.board = mockBoard as Board;
		game.clock = mockClock as Clock;
		game.sound = mockSound as Sound;
		game.music = mockMusic as Music;
	});

	function makeRemovableStone(): Stone {
		const stone = new Stone(0, 0, 0, 1, 1);
		stone.state.set({ blocked: false, removable: true });
		return stone;
	}

	function mockSelectStone(stone: Stone): void {
		(mockBoard.setStoneSelected as Mock).mockImplementation(() => {
			mockBoard.selected = stone;
		});
	}

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(game).toBeTruthy();
		});

		it('should initialize with default state', () => {
			expect(game.state()).toBe(STATES.idle);
			expect(game.mode()).toBe(GAME_MODE_STANDARD);
			expect(game.layoutID).toBeUndefined();
		});

		it('should initialize the game', () => {
			game.init();

			expect(mockStorage.getState).toHaveBeenCalled();
			expect(mockBoard.update).toHaveBeenCalled();
			expect(game.message()).toBeUndefined();
		});

		it('should offer to continue a stored game', () => {
			(mockStorage.getState as Mock).mockReturnValue({
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones: [[0, 0, 0, 1], [0, 2, 0, 1]]
			} as GameStateStore);

			game.init();

			expect(game.message()?.messageID).toBe('MSG_CONTINUE_SAVE');
		});

		it('should re-offer the shuffle prompt when reloading a deadlocked Easy-mode board', () => {
			(mockStorage.getState as Mock).mockReturnValue({
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones: [[0, 0, 0, 1], [0, 2, 0, 1]]
			} as GameStateStore);
			(mockBoard.countUnblocked as Mock).mockReturnValue(2);

			game.init();

			expect(game.message()).toEqual({ messageID: 'MSG_FAIL', askShuffle: true });
		});
	});

	describe('game state', () => {
		it('should check if game is running', () => {
			game.state.set(STATES.run);
			expect(game.isRunning()).toBe(true);

			game.state.set(STATES.pause);
			expect(game.isRunning()).toBe(false);
		});

		it('should check if game is paused', () => {
			game.state.set(STATES.pause);
			expect(game.isPaused()).toBe(true);

			game.state.set(STATES.run);
			expect(game.isPaused()).toBe(false);
		});

		it('should check if game is idle', () => {
			game.state.set(STATES.idle);
			expect(game.isIdle()).toBe(true);

			game.state.set(STATES.run);
			expect(game.isIdle()).toBe(false);
		});
	});

	describe('game actions', () => {
		it('should run the game', () => {
			game.run();

			expect(mockBoard.clearHints).toHaveBeenCalled();
			expect(mockBoard.update).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.run);
		});

		it('should pause the game', () => {
			game.layoutID = 'test';
			game.state.set(STATES.run);
			game.pause();

			expect(mockClock.pause).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.pause);
			expect(mockStorage.storeState).toHaveBeenCalled();
			expect(mockMusic.pause).toHaveBeenCalled();
		});

		it('should not pause a game that is not running', () => {
			game.layoutID = 'test';
			for (const state of [STATES.idle, STATES.pause]) {
				game.state.set(state);
				game.pause();

				expect(game.state()).toBe(state);
			}
			expect(mockClock.pause).not.toHaveBeenCalled();
			expect(mockStorage.storeState).not.toHaveBeenCalled();
		});

		it('keeps a finished game finished when a dialog pauses and resumes around it', () => {
			// what opening and closing a dialog does to a game that already ended
			game.layoutID = 'test';
			game.state.set(STATES.idle);
			game.message.set({ messageID: 'MSG_BEST', playTime: 1000 });

			game.pause();

			expect(game.isPaused()).toBe(false);
			expect(game.message()?.messageID).toBe('MSG_BEST');
		});

		it('should resume the game', () => {
			game.resume();

			expect(mockBoard.clearHints).toHaveBeenCalled();
			expect(mockBoard.update).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.run);
			expect(mockClock.run).toHaveBeenCalled();
			expect(mockMusic.play).toHaveBeenCalled();
		});

		it('should toggle between run and pause', () => {
			game.state.set(STATES.run);
			game.toggle();

			expect(game.state()).toBe(STATES.pause);

			game.toggle();

			expect(game.state()).toBe(STATES.run);
		});

		it('refuses to resume out of the stuck-board prompt', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.pause);
			game.message.set({ messageID: 'MSG_FAIL', askShuffle: true });

			game.resume();

			expect(game.state()).toBe(STATES.pause);
			expect(game.message()).toEqual({ messageID: 'MSG_FAIL', askShuffle: true });
			expect(mockClock.run).not.toHaveBeenCalled();
		});

		it('ignores the pause toggle while the stuck-board prompt is up', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.pause);
			game.message.set({ messageID: 'MSG_FAIL', askShuffle: true });

			game.toggle();

			expect(game.state()).toBe(STATES.pause);
			expect(game.message()?.askShuffle).toBe(true);
		});

		it('should reset the game', () => {
			game.reset();

			expect(mockClock.reset).toHaveBeenCalled();
			expect(mockBoard.reset).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.idle);
		});

		it('should start a new game', () => {
			const layout: Layout = {
				id: 'test',
				name: 'Test Layout',
				category: 'Test',
				mapping: [[0, 0, 0]]
			};

			game.start(layout, 'MODE_SOLVABLE', GAME_MODE_STANDARD);

			expect(game.layoutID).toBe('test');
			expect(game.mode()).toBe(GAME_MODE_STANDARD);
			expect(mockBoard.applyMapping).toHaveBeenCalledWith(layout.mapping, 'MODE_SOLVABLE');
			expect(mockBoard.update).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.run);
		});
	});

	describe('game features', () => {
		it('should provide hint in standard mode', () => {
			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.run);
			game.hint();

			expect(mockBoard.hint).toHaveBeenCalled();
		});

		it('should not provide hint in expert mode', () => {
			game.mode.set(GAME_MODE_EXPERT);
			game.state.set(STATES.run);
			game.hint();

			expect(mockBoard.hint).not.toHaveBeenCalled();
		});

		it('should not provide hint when the game is not running', () => {
			game.mode.set(GAME_MODE_STANDARD);
			for (const state of [STATES.idle, STATES.pause]) {
				game.state.set(state);

				expect(game.hint()).toBe(false);
			}
			expect(mockBoard.hint).not.toHaveBeenCalled();
		});

		it('should shuffle in easy mode', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.run);

			expect(game.shuffle()).toBe(true);
			expect(mockBoard.shuffle).toHaveBeenCalled();
			expect(mockSound.play).toHaveBeenCalledWith(SOUNDS.SHUFFLE);
		});

		it('should report a shuffle the board could not carry out', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.run);
			(mockBoard.shuffle as Mock).mockReturnValue(false);

			expect(game.shuffle()).toBe(false);
			expect(mockSound.play).not.toHaveBeenCalledWith(SOUNDS.SHUFFLE);
		});

		it('should not shuffle in standard mode', () => {
			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.run);
			game.shuffle();

			expect(mockBoard.shuffle).not.toHaveBeenCalled();
		});

		it('should not shuffle when the game is not running', () => {
			game.mode.set(GAME_MODE_EASY);
			for (const state of [STATES.idle, STATES.pause]) {
				game.state.set(state);

				expect(game.shuffle()).toBe(false);
			}
			expect(mockBoard.shuffle).not.toHaveBeenCalled();
		});

		it('still shuffles for the easy mode rescue while the game is paused', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.pause);

			game.gameOverEasyModeShuffle();

			expect(mockBoard.shuffle).toHaveBeenCalled();
		});

		it('resumes once the rescue shuffle opens up a move', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.pause);
			(mockBoard.shuffle as Mock).mockImplementation(() => {
				mockBoard.free!.set([makeRemovableStone()]);
				return true;
			});

			game.gameOverEasyModeShuffle();

			expect(game.state()).toBe(STATES.run);
		});

		it('persists the board the rescue shuffle produced', () => {
			vi.useFakeTimers();
			game.mode.set(GAME_MODE_EASY);
			game.layoutID = 'test';
			game.state.set(STATES.pause);
			game.message.set({ messageID: 'MSG_FAIL', askShuffle: true });
			(mockBoard.shuffle as Mock).mockImplementation(() => {
				mockBoard.free!.set([makeRemovableStone()]);
				return true;
			});

			game.gameOverEasyModeShuffle();
			vi.runAllTimers();

			expect(mockStorage.storeState).toHaveBeenCalledWith(expect.objectContaining({ state: STATES.run }));
			vi.useRealTimers();
		});

		it('gives up instead of retrying when the board refuses to shuffle', () => {
			game.mode.set(GAME_MODE_EASY);
			game.layoutID = 'test';
			(mockBoard.shuffle as Mock).mockReturnValue(false);

			game.gameOverEasyModeShuffle();

			expect(mockBoard.shuffle).toHaveBeenCalledTimes(1);
			expect(game.state()).toBe(STATES.idle);
			expect(game.message()).toEqual({ messageID: 'MSG_FAIL', playTime: undefined });
		});

		it('resumes from the prompt itself, which is what the shuffle button clicks', () => {
			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.pause);
			game.message.set({ messageID: 'MSG_FAIL', askShuffle: true });
			(mockBoard.shuffle as Mock).mockImplementation(() => {
				mockBoard.free!.set([makeRemovableStone()]);
				return true;
			});

			game.gameOverEasyModeShuffle();

			expect(game.state()).toBe(STATES.run);
			expect(game.message()).toBeUndefined();
		});

		it('should resume the game when the rescue shuffle frees a stone', () => {
			game.mode.set(GAME_MODE_EASY);
			game.layoutID = 'test';
			(mockBoard.shuffle as Mock).mockImplementation(() => {
				mockBoard.free!.set([makeRemovableStone()]);
				return true;
			});

			game.gameOverEasyModeShuffle();

			expect(mockBoard.shuffle).toHaveBeenCalledTimes(1);
			expect(game.state()).toBe(STATES.run);
		});

		it('should play the shuffle sound once no matter how many rescue shuffles it takes', () => {
			game.mode.set(GAME_MODE_EASY);
			game.layoutID = 'test';

			game.gameOverEasyModeShuffle();

			expect(mockBoard.shuffle).toHaveBeenCalledTimes(RESCUE_SHUFFLE_ATTEMPTS);
			expect((mockSound.play as Mock).mock.calls.filter(([sound]) => sound === SOUNDS.SHUFFLE).length).toBe(1);
		});

		it('should end the game instead of re-offering the shuffle when no rescue shuffle succeeds', () => {
			game.mode.set(GAME_MODE_EASY);
			game.layoutID = 'test';

			game.gameOverEasyModeShuffle();

			expect(mockBoard.shuffle).toHaveBeenCalledTimes(RESCUE_SHUFFLE_ATTEMPTS);
			expect(game.state()).toBe(STATES.idle);
			expect(game.message()).toEqual({ messageID: 'MSG_FAIL', playTime: undefined });
			expect(mockSound.play).toHaveBeenCalledWith(SOUNDS.OVER);
			expect(mockStorage.storeScore).toHaveBeenCalledWith('test', { loseCount: 1 });
		});

		it('should undo in standard mode', () => {
			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.run);
			game.back();

			expect(mockBoard.back).toHaveBeenCalled();
		});

		it('should persist an undo', () => {
			vi.useFakeTimers();
			(mockBoard.back as Mock).mockReturnValue(true);
			game.layoutID = 'test';
			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.run);

			game.back();
			vi.runAllTimers();

			expect(mockStorage.storeState).toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('should not undo in expert mode', () => {
			game.mode.set(GAME_MODE_EXPERT);
			game.state.set(STATES.run);
			game.back();

			expect(mockBoard.back).not.toHaveBeenCalled();
		});
	});

	describe('stone interaction', () => {
		it('should clear selection when clicking with no stone', () => {
			game.click(undefined);

			expect(mockBoard.clearSelection).toHaveBeenCalled();
		});

		it('should play nope sound when clicking blocked stone', () => {
			const stone = new Stone(0, 0, 0, 1, 1);
			stone.state.set({ blocked: true, removable: false });

			game.state.set(STATES.run);
			game.click(stone);

			expect(mockSound.play).toHaveBeenCalledWith(SOUNDS.NOPE);
		});

		it('should select stone when clicking unblocked stone', () => {
			const stone = makeRemovableStone();

			game.state.set(STATES.run);
			game.click(stone);

			expect(mockBoard.setStoneSelected).toHaveBeenCalledWith(stone);
			expect(mockSound.play).toHaveBeenCalledWith(SOUNDS.SELECT);
		});

		it('should clear hints when clicking any unblocked stone', () => {
			const stone = makeRemovableStone();

			game.state.set(STATES.run);
			game.click(stone);

			expect(mockBoard.clearHints).toHaveBeenCalled();
		});

		it('should match stones when clicking matching stone', () => {
			const stone1 = new Stone(0, 0, 0, 1, 1);
			stone1.state.set({ blocked: false, removable: true });

			const stone2 = new Stone(0, 1, 0, 1, 1);
			stone2.state.set({ blocked: false, removable: true });

			mockBoard.selected = stone1;

			game.state.set(STATES.run);
			game.click(stone2);

			expect(mockBoard.pick).toHaveBeenCalledWith(stone1, stone2);
		});

		it('should highlight match partners on selection in easy mode', () => {
			vi.useFakeTimers();
			const stone = makeRemovableStone();
			mockSelectStone(stone);

			game.mode.set(GAME_MODE_EASY);
			game.state.set(STATES.run);
			game.click(stone);

			expect(mockBoard.highlightMatches).toHaveBeenCalledWith(stone);
			vi.runAllTimers();
			expect(mockBoard.clearMatches).toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('should not highlight match partners in standard mode', () => {
			const stone = makeRemovableStone();
			mockSelectStone(stone);

			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.run);
			game.click(stone);

			expect(mockBoard.highlightMatches).not.toHaveBeenCalled();
			expect(mockBoard.clearMatches).toHaveBeenCalled();
		});

		it('should not highlight match partners in expert mode', () => {
			const stone = makeRemovableStone();
			mockSelectStone(stone);

			game.mode.set(GAME_MODE_EXPERT);
			game.state.set(STATES.run);
			game.click(stone);

			expect(mockBoard.highlightMatches).not.toHaveBeenCalled();
			expect(mockBoard.clearMatches).toHaveBeenCalled();
		});

		it('should clear match highlights when a match is resolved', () => {
			vi.useFakeTimers();
			const stone1 = makeRemovableStone();
			const stone2 = makeRemovableStone();
			mockSelectStone(stone1);

			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.run);
			game.click(stone1);

			mockBoard.selected = stone1;
			game.click(stone2);

			expect(mockBoard.clearMatches).toHaveBeenCalled();
			vi.useRealTimers();
		});
	});

	describe('save and load', () => {
		it('should save game state', () => {
			game.layoutID = 'test';
			game.mode.set(GAME_MODE_STANDARD);
			game.state.set(STATES.pause);
			mockClock.elapsed!.set(1000);

			game.save();

			expect(mockStorage.storeState).toHaveBeenCalledWith({
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_STANDARD,
				undo: [],
				stones: []
			});
		});

		it('should load game state', () => {
			const stones: Array<StonePlace> = [[0, 0, 0, 1], [0, 2, 0, 1]];
			const state: GameStateStore = {
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones
			};

			(mockStorage.getState as Mock).mockReturnValue(state);

			const result = game.load();

			expect(result).toBe(true);
			expect(mockClock.elapsed!()).toBe(1000);
			expect(game.layoutID).toBe('test');
			expect(game.mode()).toBe(GAME_MODE_EASY);
			expect(game.state()).toBe(STATES.pause);
			expect(mockBoard.load).toHaveBeenCalledWith(stones, []);
		});

		it('should handle load failure', () => {
			(mockStorage.getState as Mock).mockReturnValue(undefined);

			const result = game.load();

			expect(result).toBe(false);
		});

		it('should discard a stored board the board could not restore', () => {
			(mockBoard.load as Mock).mockReturnValue(false);
			(mockStorage.getState as Mock).mockReturnValue({
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones: [[0, 0, 0, 1], [0, 2, 0, 1]]
			} as GameStateStore);

			const result = game.load();

			expect(result).toBe(false);
			expect(game.state()).toBe(STATES.idle);
			expect(game.layoutID).toBeUndefined();
			// cleared, so the next start does not offer the same broken board again
			expect(mockStorage.storeState).toHaveBeenCalledWith();
		});

		it('should offer a new game rather than a continue for a board that failed to restore', () => {
			(mockBoard.load as Mock).mockReturnValue(false);
			(mockStorage.getState as Mock).mockReturnValue({
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones: [[0, 0, 0, 1], [0, 2, 0, 1]]
			} as GameStateStore);

			game.init();

			expect(game.message()).toBeUndefined();
			expect(game.isIdle()).toBe(true);
		});

		it('should not restore a stored board that has no tiles', () => {
			// what older builds could leave behind
			(mockStorage.getState as Mock).mockReturnValue({
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones: []
			} as GameStateStore);

			const result = game.load();

			expect(result).toBe(false);
			expect(mockBoard.load).not.toHaveBeenCalled();
			expect(game.state()).toBe(STATES.idle);
		});

		it('should offer a new game rather than a continue for an emptied save', () => {
			(mockStorage.getState as Mock).mockReturnValue({
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				state: STATES.pause,
				stones: []
			} as GameStateStore);

			game.init();

			expect(game.message()).toBeUndefined();
		});

		it('should not persist anything after a reset', () => {
			game.layoutID = 'test';

			game.reset();
			game.save();

			expect(game.layoutID).toBeUndefined();
			expect(mockStorage.storeState).not.toHaveBeenCalled();
		});

		it('keeps saving normally once a new game has started', () => {
			game.reset();
			game.start({ id: 'next', name: 'Next', category: 'Test', mapping: [[0, 0, 0]] }, 'MODE_SOLVABLE', GAME_MODE_STANDARD);

			game.save();

			expect(game.layoutID).toBe('next');
			expect(mockStorage.storeState).toHaveBeenCalled();
		});
	});
});
