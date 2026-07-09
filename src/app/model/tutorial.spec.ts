import { TUTORIAL_STEPS, createTutorialBoard } from './tutorial';
import { Board } from './board';
import { describe, it, expect } from 'vitest';

describe('TUTORIAL_STEPS', () => {
	it('is a non-empty array', () => {
		expect(TUTORIAL_STEPS.length).toBeGreaterThan(0);
	});

	it('every step has id, titleKey, descriptionKey, and board', () => {
		for (const step of TUTORIAL_STEPS) {
			expect(typeof step.id).toBe('string');
			expect(step.id.length).toBeGreaterThan(0);
			expect(typeof step.titleKey).toBe('string');
			expect(typeof step.descriptionKey).toBe('string');
			expect(Array.isArray(step.board)).toBe(true);
			expect(step.board.length).toBeGreaterThan(0);
		}
	});

	it('every step id is unique', () => {
		const ids = TUTORIAL_STEPS.map(s => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('createTutorialBoard', () => {
	it('returns a Board instance', () => {
		const board = createTutorialBoard(TUTORIAL_STEPS[0].board);
		expect(board).toBeInstanceOf(Board);
	});

	it('returns a board with stones for a valid mapping', () => {
		const board = createTutorialBoard(TUTORIAL_STEPS[0].board);
		expect(board.stones().length).toBeGreaterThan(0);
	});

	it('returns a board with stones for every tutorial step', () => {
		for (const step of TUTORIAL_STEPS) {
			const board = createTutorialBoard(step.board);
			expect(board.stones()).toHaveLength(step.board.length);
		}
	});

	it('returns an empty board for an empty mapping', () => {
		const board = createTutorialBoard([]);
		expect(board.stones()).toHaveLength(0);
	});
});
