import { Solver } from './solver';
import type { StonePosition } from './stone';

describe('Solver', () => {
	let solver: Solver;

	beforeEach(() => {
		solver = new Solver();
	});

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(solver).toBeTruthy();
		});
	});

	describe('solveLayout', () => {
		it('should determine if a layout is solvable', () => {
			// Create a simple solvable layout with two matching pairs
			const stones: Array<StonePosition> = [
				// First pair (group 1)
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
				{ x: 2, y: 0, z: 0, v: 1, groupNr: 1 },
				// Second pair (group 2)
				{ x: 0, y: 2, z: 0, v: 2, groupNr: 2 },
				{ x: 2, y: 2, z: 0, v: 2, groupNr: 2 }
			];

			const result = solver.solveLayout(stones);

			// The result should be 0 for a completely solvable layout
			expect(result).toBe(0);
		});

		it('should handle an unsolvable layout', () => {
			// Create an unsolvable layout (stones blocking each other)
			const stones: Array<StonePosition> = [
				// First pair (group 1)
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
				{ x: 0, y: 1, z: 1, v: 1, groupNr: 1 }, // This stone is above and blocks the first one
				// Second pair (group 2)
				{ x: 2, y: 0, z: 0, v: 2, groupNr: 2 },
				{ x: 2, y: 1, z: 1, v: 2, groupNr: 2 }  // This stone is above and blocks the third one
			];

			const result = solver.solveLayout(stones);

			// The result should be > 0 for an unsolvable layout
			expect(result).toBeGreaterThan(0);
		});

		it('should handle an empty layout', () => {
			const stones: Array<StonePosition> = [];

			const result = solver.solveLayout(stones);

			// The result should be 0 for an empty layout (trivially solvable)
			expect(result).toBe(0);
		});
	});

	describe('writeGame', () => {
		it('should generate a solution for a solvable layout', () => {
			// Create a simple solvable layout with two matching pairs
			const stones: Array<StonePosition> = [
				// First pair (group 1)
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
				{ x: 2, y: 0, z: 0, v: 1, groupNr: 1 },
				// Second pair (group 2)
				{ x: 0, y: 2, z: 0, v: 2, groupNr: 2 },
				{ x: 2, y: 2, z: 0, v: 2, groupNr: 2 }
			];

			// First solve the layout
			solver.solveLayout(stones);

			// Then get the solution
			const solution = solver.writeGame();

			// The solution should contain 4 positions (2 pairs)
			expect(solution).toHaveLength(4);

			// Each position should be a 3-element array [z, x, y]
			for (const pos of solution) {
				expect(pos).toHaveLength(3);
				expect(typeof pos[0]).toBe('number'); // z
				expect(typeof pos[1]).toBe('number'); // x
				expect(typeof pos[2]).toBe('number'); // y
			}
		});
	});

	// Test helper function to create a more complex layout
	function createComplexLayout(): Array<StonePosition> {
		// Create a different complex layout with multiple layers and groups
		return [
			// Layer 0 (bottom) - Outer ring
			{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
			{ x: 8, y: 0, z: 0, v: 1, groupNr: 1 },
			{ x: 0, y: 4, z: 0, v: 2, groupNr: 2 },
			{ x: 8, y: 4, z: 0, v: 2, groupNr: 2 },

			// Layer 0 - Inner pattern
			{ x: 2, y: 1, z: 0, v: 3, groupNr: 3 },
			{ x: 6, y: 1, z: 0, v: 3, groupNr: 3 },
			{ x: 2, y: 3, z: 0, v: 4, groupNr: 4 },
			{ x: 6, y: 3, z: 0, v: 4, groupNr: 4 },

			// Layer 1 (middle) - Diamond pattern
			{ x: 3, y: 0, z: 1, v: 5, groupNr: 5 },
			{ x: 5, y: 0, z: 1, v: 5, groupNr: 5 },
			{ x: 1, y: 2, z: 1, v: 6, groupNr: 6 },
			{ x: 7, y: 2, z: 1, v: 6, groupNr: 6 },
			{ x: 3, y: 4, z: 1, v: 7, groupNr: 7 },
			{ x: 5, y: 4, z: 1, v: 7, groupNr: 7 },

			// Layer 2 (top) - Center cross
			{ x: 4, y: 1, z: 2, v: 8, groupNr: 8 },
			{ x: 4, y: 3, z: 2, v: 8, groupNr: 8 },
			{ x: 3, y: 2, z: 2, v: 9, groupNr: 9 },
			{ x: 5, y: 2, z: 2, v: 9, groupNr: 9 }
		];
	}

	it('should solve a more complex layout', () => {
		const stones = createComplexLayout();

		const result = solver.solveLayout(stones);

		// The layout should be solvable
		expect(result).toBe(0);

		const solution = solver.writeGame();

		// The solution should contain all stones
		expect(solution).toHaveLength(stones.length);
	});
});
