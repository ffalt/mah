import { Board } from './board';
import { Stone } from './stone';

describe('Board', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  describe('initialization', () => {
    it('should create an instance', () => {
      expect(board).toBeTruthy();
    });

    it('should initialize with empty state', () => {
      expect(board.stones).toEqual([]);
      expect(board.free).toEqual([]);
      expect(board.count).toBe(0);
      expect(board.selected).toBeUndefined();
      expect(board.undo).toEqual([]);
      expect(board.hints.groups).toEqual([]);
      expect(board.hints.current).toBeUndefined();
    });
  });

  describe('stone selection', () => {
    it('should set a stone as selected', () => {
      const stone = new Stone(0, 0, 0, 1, 1);
      board.setStoneSelected(stone);
      expect(board.selected).toBe(stone);
      expect(stone.selected).toBe(true);
    });

    it('should clear selection', () => {
      const stone = new Stone(0, 0, 0, 1, 1);
      board.setStoneSelected(stone);
      board.clearSelection();
      expect(board.selected).toBeUndefined();
      expect(stone.selected).toBe(false);
    });
  });

  describe('hints', () => {
    it('should clear hints', () => {
      // Setup a hint state first
      const stone = new Stone(0, 0, 0, 1, 1);
      stone.hinted = true;
      board.hints = {
        groups: [{ group: 1, stones: [stone] }],
        current: { group: 1, stones: [stone] }
      };

      board.clearHints();

      expect(stone.hinted).toBe(false);
      expect(board.hints.groups).toEqual([]);
      expect(board.hints.current).toBeUndefined();
    });
  });

  describe('game actions', () => {
    it('should reset the board', () => {
      // Setup some state
      const stone = new Stone(0, 0, 0, 1, 1);
      board.stones = [stone];
      board.free = [stone];
      board.count = 1;
      board.setStoneSelected(stone);
      board.undo = [[0, 0, 0]];

      board.reset();

      expect(board.stones).toEqual([]);
      expect(board.free).toEqual([]);
      expect(board.count).toBe(0);
      expect(board.selected).toBeUndefined();
      expect(board.undo).toEqual([]);
    });

    it('should pick stones', () => {
      const stone1 = new Stone(0, 0, 0, 1, 1);
      const stone2 = new Stone(0, 1, 0, 1, 1);
      board.stones = [stone1, stone2];

      // Mock update method to avoid dependencies
      board.update = jest.fn();

      board.pick(stone1, stone2);

      expect(stone1.picked).toBe(true);
      expect(stone2.picked).toBe(true);
      expect(board.undo).toEqual([[0, 0, 0], [0, 1, 0]]);
      expect(board.update).toHaveBeenCalled();
    });
  });

  describe('save and load', () => {
    it('should save the board state', () => {
      const stone1 = new Stone(0, 0, 0, 1, 1);
      const stone2 = new Stone(0, 1, 0, 2, 1);
      board.stones = [stone1, stone2];

      const savedState = board.save();

      expect(savedState).toEqual([
        [0, 0, 0, 1],
        [0, 1, 0, 2]
      ]);
    });
  });
});
