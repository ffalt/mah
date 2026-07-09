import { signal } from '@angular/core';
import { Game } from './game';
import type { Board } from './board';
import type { Clock } from './clock';
import { type Sound, SOUNDS } from './sound';
import type { Music } from './music';
import { STATES, GAME_MODE_STANDARD, GAME_MODE_EASY, GAME_MODE_EXPERT } from './consts';
import { Stone } from './stone';
import type { GameStateStore, Layout, Place, StorageProvider } from './types';
import { Mock, describe, beforeEach, it, expect, vi } from 'vitest';

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
			shuffle: vi.fn(),
			back: vi.fn(),
			load: vi.fn(),
			save: vi.fn().mockReturnValue([]),
			reset: vi.fn(),
			applyMapping: vi.fn(),
			pick: vi.fn(),
			highlightMatches: vi.fn(),
			clearMatches: vi.fn(),
			selected: undefined,
			count: signal(10),
			free: signal<Array<Stone>>([]),
			undo: signal<Array<Place>>([])
		};

		// Create mock clock
		mockClock = {
			elapsed: signal(0),
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
			expect(game.mode).toBe(GAME_MODE_STANDARD);
			expect(game.layoutID).toBeUndefined();
		});

		it('should initialize the game', () => {
			game.init();

			expect(mockStorage.getState).toHaveBeenCalled();
			expect(mockBoard.update).toHaveBeenCalled();
			expect(game.message()).toBeDefined();
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
			game.pause();

			expect(mockClock.pause).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.pause);
			expect(mockStorage.storeState).toHaveBeenCalled();
			expect(mockMusic.pause).toHaveBeenCalled();
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
			expect(game.mode).toBe(GAME_MODE_STANDARD);
			expect(mockBoard.applyMapping).toHaveBeenCalledWith(layout.mapping, 'MODE_SOLVABLE');
			expect(mockBoard.update).toHaveBeenCalled();
			expect(game.state()).toBe(STATES.run);
		});
	});

	describe('game features', () => {
		it('should provide hint in standard mode', () => {
			game.mode = GAME_MODE_STANDARD;
			game.hint();

			expect(mockBoard.hint).toHaveBeenCalled();
		});

		it('should not provide hint in expert mode', () => {
			game.mode = GAME_MODE_EXPERT;
			game.hint();

			expect(mockBoard.hint).not.toHaveBeenCalled();
		});

		it('should shuffle in easy mode', () => {
			game.mode = GAME_MODE_EASY;
			game.shuffle();

			expect(mockBoard.shuffle).toHaveBeenCalled();
		});

		it('should not shuffle in standard mode', () => {
			game.mode = GAME_MODE_STANDARD;
			game.shuffle();

			expect(mockBoard.shuffle).not.toHaveBeenCalled();
		});

		it('should undo in standard mode', () => {
			game.mode = GAME_MODE_STANDARD;
			game.state.set(STATES.run);
			game.back();

			expect(mockBoard.back).toHaveBeenCalled();
		});

		it('should not undo in expert mode', () => {
			game.mode = GAME_MODE_EXPERT;
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

			game.mode = GAME_MODE_EASY;
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

			game.mode = GAME_MODE_STANDARD;
			game.state.set(STATES.run);
			game.click(stone);

			expect(mockBoard.highlightMatches).not.toHaveBeenCalled();
			expect(mockBoard.clearMatches).toHaveBeenCalled();
		});

		it('should not highlight match partners in expert mode', () => {
			const stone = makeRemovableStone();
			mockSelectStone(stone);

			game.mode = GAME_MODE_EXPERT;
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

			game.mode = GAME_MODE_STANDARD;
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
			game.mode = GAME_MODE_STANDARD;
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
			const state: GameStateStore = {
				elapsed: 1000,
				state: STATES.pause,
				layout: 'test',
				gameMode: GAME_MODE_EASY,
				undo: [],
				stones: []
			};

			(mockStorage.getState as Mock).mockReturnValue(state);

			const result = game.load();

			expect(result).toBe(true);
			expect(mockClock.elapsed!()).toBe(1000);
			expect(game.layoutID).toBe('test');
			expect(game.mode).toBe(GAME_MODE_EASY);
			expect(game.state()).toBe(STATES.pause);
			expect(mockBoard.load).toHaveBeenCalledWith([], []);
		});

		it('should handle load failure', () => {
			(mockStorage.getState as Mock).mockReturnValue(undefined);

			const result = game.load();

			expect(result).toBe(false);
		});
	});
});
