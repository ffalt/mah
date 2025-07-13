import { Game } from './game';
import type { Board } from './board';
import type { Clock } from './clock';
import { type Sound, SOUNDS } from './sound';
import type { Music } from './music';
import { STATES, GAME_MODE_STANDARD, GAME_MODE_EASY, GAME_MODE_EXPERT } from './consts';
import { Stone } from './stone';
import type { GameStateStore, Layout, StorageProvider } from './types';

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
      getState: jest.fn(),
      storeState: jest.fn(),
      getScore: jest.fn(),
      storeScore: jest.fn()
    } as unknown as StorageProvider;

    // Create mock board
    mockBoard = {
      update: jest.fn(),
      clearSelection: jest.fn(),
      setStoneSelected: jest.fn(),
      clearHints: jest.fn(),
      hint: jest.fn(),
      shuffle: jest.fn(),
      back: jest.fn(),
      load: jest.fn(),
      save: jest.fn().mockReturnValue([]),
      reset: jest.fn(),
      applyMapping: jest.fn(),
      pick: jest.fn(),
      selected: undefined,
      count: 10,
      free: [],
      undo: []
    };

    // Create mock clock
    mockClock = {
      elapsed: 0,
      run: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn()
    };

    // Create mock sound
    mockSound = {
      play: jest.fn()
    };

    // Create mock music
    mockMusic = {
      play: jest.fn(),
      pause: jest.fn()
    };

    // Create game instance
    game = new Game(mockStorage);

    // Replace dependencies with mocks
    game.board = mockBoard as Board;
    game.clock = mockClock as Clock;
    game.sound = mockSound as Sound;
    game.music = mockMusic as Music;
  });

  describe('initialization', () => {
    it('should create an instance', () => {
      expect(game).toBeTruthy();
    });

    it('should initialize with default state', () => {
      expect(game.state).toBe(STATES.idle);
      expect(game.mode).toBe(GAME_MODE_STANDARD);
      expect(game.layoutID).toBeUndefined();
    });

    it('should initialize the game', () => {
      game.init();

      expect(mockStorage.getState).toHaveBeenCalled();
      expect(mockBoard.update).toHaveBeenCalled();
      expect(game.message).toBeDefined();
    });
  });

  describe('game state', () => {
    it('should check if game is running', () => {
      game.state = STATES.run;
      expect(game.isRunning()).toBe(true);

      game.state = STATES.pause;
      expect(game.isRunning()).toBe(false);
    });

    it('should check if game is paused', () => {
      game.state = STATES.pause;
      expect(game.isPaused()).toBe(true);

      game.state = STATES.run;
      expect(game.isPaused()).toBe(false);
    });

    it('should check if game is idle', () => {
      game.state = STATES.idle;
      expect(game.isIdle()).toBe(true);

      game.state = STATES.run;
      expect(game.isIdle()).toBe(false);
    });
  });

  describe('game actions', () => {
    it('should run the game', () => {
      game.run();

      expect(mockBoard.clearHints).toHaveBeenCalled();
      expect(mockBoard.update).toHaveBeenCalled();
      expect(game.state).toBe(STATES.run);
    });

    it('should pause the game', () => {
      game.pause();

      expect(mockClock.pause).toHaveBeenCalled();
      expect(game.state).toBe(STATES.pause);
      expect(mockStorage.storeState).toHaveBeenCalled();
      expect(mockMusic.pause).toHaveBeenCalled();
    });

    it('should resume the game', () => {
      game.resume();

      expect(mockBoard.clearHints).toHaveBeenCalled();
      expect(mockBoard.update).toHaveBeenCalled();
      expect(game.state).toBe(STATES.run);
      expect(mockClock.run).toHaveBeenCalled();
      expect(mockMusic.play).toHaveBeenCalled();
    });

    it('should toggle between run and pause', () => {
      game.state = STATES.run;
      game.toggle();

      expect(game.state).toBe(STATES.pause);

      game.toggle();

      expect(game.state).toBe(STATES.run);
    });

    it('should reset the game', () => {
      game.reset();

      expect(mockClock.reset).toHaveBeenCalled();
      expect(mockBoard.reset).toHaveBeenCalled();
      expect(game.state).toBe(STATES.idle);
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
      expect(game.state).toBe(STATES.run);
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
      game.state = STATES.run;
      game.back();

      expect(mockBoard.back).toHaveBeenCalled();
    });

    it('should not undo in expert mode', () => {
      game.mode = GAME_MODE_EXPERT;
      game.state = STATES.run;
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
      stone.state = { blocked: true, removable: false };

      game.state = STATES.run;
      game.click(stone);

      expect(mockSound.play).toHaveBeenCalledWith(SOUNDS.NOPE);
    });

    it('should select stone when clicking unblocked stone', () => {
      const stone = new Stone(0, 0, 0, 1, 1);
      stone.state = { blocked: false, removable: true };

      game.state = STATES.run;
      game.click(stone);

      expect(mockBoard.setStoneSelected).toHaveBeenCalledWith(stone);
      expect(mockSound.play).toHaveBeenCalledWith(SOUNDS.SELECT);
    });

    it('should match stones when clicking matching stone', () => {
      const stone1 = new Stone(0, 0, 0, 1, 1);
      stone1.state = { blocked: false, removable: true };

      const stone2 = new Stone(0, 1, 0, 1, 1);
      stone2.state = { blocked: false, removable: true };

      mockBoard.selected = stone1;

      game.state = STATES.run;
      game.click(stone2);

      expect(mockBoard.pick).toHaveBeenCalledWith(stone1, stone2);
    });
  });

  describe('save and load', () => {
    it('should save game state', () => {
      game.layoutID = 'test';
      game.mode = GAME_MODE_STANDARD;
      game.state = STATES.pause;
      mockClock.elapsed = 1000;

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

      (mockStorage.getState as jest.Mock).mockReturnValue(state);

      const result = game.load();

      expect(result).toBe(true);
      expect(mockClock.elapsed).toBe(1000);
      expect(game.layoutID).toBe('test');
      expect(game.mode).toBe(GAME_MODE_EASY);
      expect(game.state).toBe(STATES.pause);
      expect(mockBoard.load).toHaveBeenCalledWith([], []);
    });

    it('should handle load failure', () => {
      (mockStorage.getState as jest.Mock).mockReturnValue(undefined);

      const result = game.load();

      expect(result).toBe(false);
    });
  });
});
