import { Board } from './board';
import { Stone } from './stone';
import { describe, beforeEach, it, expect, vi } from 'vitest';

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
			expect(board.stones()).toEqual([]);
			expect(board.free()).toEqual([]);
			expect(board.count()).toBe(0);
			expect(board.selected).toBeUndefined();
			expect(board.undo()).toEqual([]);
			expect(board.hints.groups).toEqual([]);
			expect(board.hints.current).toBeUndefined();
		});
	});

	describe('stone selection', () => {
		it('should set a stone as selected', () => {
			const stone = new Stone(0, 0, 0, 1, 1);
			board.setStoneSelected(stone);
			expect(board.selected).toBe(stone);
			expect(stone.selected()).toBe(true);
		});

		it('should clear selection', () => {
			const stone = new Stone(0, 0, 0, 1, 1);
			board.setStoneSelected(stone);
			board.clearSelection();
			expect(board.selected).toBeUndefined();
			expect(stone.selected()).toBe(false);
		});
	});

	describe('hints', () => {
		it('should clear hints', () => {
			// Setup a hint state first
			const stone = new Stone(0, 0, 0, 1, 1);
			stone.hinted.set(true);
			board.hints = {
				groups: [{ group: 1, stones: [stone] }],
				current: { group: 1, stones: [stone] }
			};

			board.clearHints();

			expect(stone.hinted()).toBe(false);
			expect(board.hints.groups).toEqual([]);
			expect(board.hints.current).toBeUndefined();
		});
	});

	describe('match highlighting', () => {
		it('should highlight free partner stones for a selected stone', () => {
			const selected = new Stone(0, 0, 0, 1, 5);
			const partner1 = new Stone(0, 2, 0, 1, 5);
			const partner2 = new Stone(0, 4, 0, 1, 5);
			const other = new Stone(0, 6, 0, 1, 9);
			board.free.set([selected, partner1, partner2, other]);

			board.highlightMatches(selected);

			expect(selected.matched()).toBe(false);
			expect(partner1.matched()).toBe(true);
			expect(partner2.matched()).toBe(true);
			expect(other.matched()).toBe(false);
		});

		it('should clear matched flags on all stones', () => {
			const stone1 = new Stone(0, 0, 0, 1, 1);
			const stone2 = new Stone(0, 1, 0, 1, 1);
			stone1.matched.set(true);
			stone2.matched.set(true);
			board.stones.set([stone1, stone2]);

			board.clearMatches();

			expect(stone1.matched()).toBe(false);
			expect(stone2.matched()).toBe(false);
		});
	});

	describe('game actions', () => {
		it('should reset the board', () => {
			// Setup some state
			const stone = new Stone(0, 0, 0, 1, 1);
			board.stones.set([stone]);
			board.free.set([stone]);
			board.count.set(1);
			board.setStoneSelected(stone);
			board.undo.set([[0, 0, 0]]);

			board.reset();

			expect(board.stones()).toEqual([]);
			expect(board.free()).toEqual([]);
			expect(board.count()).toBe(0);
			expect(board.selected).toBeUndefined();
			expect(board.undo()).toEqual([]);
		});

		it('should pick stones', () => {
			const stone1 = new Stone(0, 0, 0, 1, 1);
			const stone2 = new Stone(0, 1, 0, 1, 1);
			board.stones.set([stone1, stone2]);

			// Mock update method to avoid dependencies
			board.update = vi.fn();

			board.pick(stone1, stone2);

			expect(stone1.picked()).toBe(true);
			expect(stone2.picked()).toBe(true);
			expect(board.undo()).toEqual([[0, 0, 0], [0, 1, 0]]);
			expect(board.update).toHaveBeenCalled();
		});
	});

	describe('save and load', () => {
		it('should save the board state', () => {
			const stone1 = new Stone(0, 0, 0, 1, 1);
			const stone2 = new Stone(0, 1, 0, 2, 1);
			board.stones.set([stone1, stone2]);

			const savedState = board.save();

			expect(savedState).toEqual([
				[0, 0, 0, 1],
				[0, 1, 0, 2]
			]);
		});

		it('should restore the picked state of undone stones', () => {
			const mapping = Array.from({ length: 8 }, (_, index) => [0, index * 2, 0, index + 1] as [number, number, number, number]);

			const loaded = board.load(mapping, [[0, 0, 0], [0, 2, 0]]);

			expect(loaded).toBe(true);
			const stones = board.stones();
			expect(stones.length).toBe(8);
			expect(stones.filter(stone => stone.picked()).map(stone => stone.x)).toEqual([0, 2]);
			expect(board.undo()).toEqual([[0, 0, 0], [0, 2, 0]]);
		});

		it('should restore a stored tile value above the place count', () => {
			// a board can hold tiles numbered past its own place count
			const mapping = Array.from({ length: 8 }, (_, index) => [0, index * 2, 0, index + 137] as [number, number, number, number]);

			const loaded = board.load(mapping, []);

			expect(loaded).toBe(true);
			expect(board.stones()).toHaveLength(8);
			for (const stone of board.stones()) {
				expect(stone.img?.id).toBeDefined();
			}
		});

		it('should refuse a stored board whose tiles cannot be resolved', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			const mapping = Array.from({ length: 8 }, (_, index) => [0, index * 2, 0, index + 1] as [number, number, number, number]);
			// a value no tile table can resolve
			mapping[3][3] = -5;

			const loaded = board.load(mapping, []);

			expect(loaded).toBe(false);
			expect(board.stones()).toHaveLength(0);
			expect(board.undo()).toEqual([]);
			warnSpy.mockRestore();
		});

		it('should refuse an empty stored board', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			expect(board.load([], [])).toBe(false);
			expect(board.stones()).toHaveLength(0);
			warnSpy.mockRestore();
		});
	});
});
