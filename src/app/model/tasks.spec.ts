import { MAX_PROGRESS_REPORTS, solveGame, statsSolveMapping } from './tasks';
import type { Solver } from './solver/solver';
import { Builder, MODE_SOLVABLE } from './builder';
import type { Stone, StonePosition } from './stone';
import type { Mapping, Place } from './types';
import { describe, it, expect, vi } from 'vitest';

describe('Tasks', () => {
	describe('solveGame', () => {
		it('should solve a game and call the finish callback with the result', () => {
			// Setup mock data
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
				{ x: 1, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const mockResult = 0; // Solvable
			const mockOrder: Array<Place> = [[0, 0, 0], [0, 1, 0]];

			// Stub solver injected in place of the real one
			const solveLayout = vi.fn().mockReturnValue(mockResult);
			const writeGame = vi.fn().mockReturnValue(mockOrder);
			const solver = { solveLayout, writeGame } as unknown as Solver;

			// Create finish callback mock
			const finishCallback = vi.fn();

			// Call the function
			solveGame(stones, finishCallback, solver);

			// Verify solver was called with the stones
			expect(solveLayout).toHaveBeenCalledWith(stones);

			// Verify writeGame was called
			expect(writeGame).toHaveBeenCalled();

			// Verify finish callback was called with the expected result
			expect(finishCallback).toHaveBeenCalledWith({
				result: mockResult,
				order: mockOrder
			});
		});
	});

	describe('statsSolveMapping', () => {
		it('should generate and solve multiple layouts and track statistics', () => {
			// Setup mock data
			const mapping: Mapping = [[0, 0, 0], [0, 1, 0]];
			const rounds = 3;
			const mockStones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
				{ x: 1, y: 0, z: 0, v: 1, groupNr: 1 }
			];

			// Stub builder and solver injected in place of the real ones
			const build = vi.fn().mockReturnValue(mockStones);
			const builder = { build } as unknown as Builder;
			const solveLayout = vi.fn()
				.mockReturnValueOnce(0) // First round: solvable
				.mockReturnValueOnce(2) // Second round: unsolvable
				.mockReturnValueOnce(0); // Third round: solvable
			const solver = { solveLayout } as unknown as Solver;

			// Create callback mocks
			const progressCallback = vi.fn();
			const finishCallback = vi.fn();

			// Call the function
			statsSolveMapping(mapping, rounds, progressCallback, finishCallback, solver, builder);

			// Verify build was called for each round
			expect(build).toHaveBeenCalledTimes(rounds);
			expect(build).toHaveBeenCalledWith(MODE_SOLVABLE, mapping);

			// Verify solveLayout was called for each round
			expect(solveLayout).toHaveBeenCalledTimes(rounds);
			expect(solveLayout).toHaveBeenCalledWith(mockStones);

			// Verify progress callback was called for each round
			expect(progressCallback).toHaveBeenCalledTimes(rounds);
			expect(progressCallback).toHaveBeenNthCalledWith(1, [1, 0]); // First round: 1 win, 0 fails
			expect(progressCallback).toHaveBeenNthCalledWith(2, [1, 1]); // Second round: 1 win, 1 fail
			expect(progressCallback).toHaveBeenNthCalledWith(3, [2, 1]); // Third round: 2 wins, 1 fail

			// Verify finish callback was called with the final statistics
			expect(finishCallback).toHaveBeenCalledWith([2, 1]); // Final: 2 wins, 1 fail
		});

		it('should handle the case where build returns undefined', () => {
			// Setup mock data
			const mapping: Mapping = [[0, 0, 0], [0, 1, 0]];
			const rounds = 1;

			// Stub builder and solver injected in place of the real ones
			const build = vi.fn().mockReturnValue(undefined);
			const builder = { build } as unknown as Builder;
			const solveLayout = vi.fn();
			const solver = { solveLayout } as unknown as Solver;

			// Create callback mocks
			const progressCallback = vi.fn();
			const finishCallback = vi.fn();

			// Call the function
			statsSolveMapping(mapping, rounds, progressCallback, finishCallback, solver, builder);

			// Verify build was called
			expect(build).toHaveBeenCalledTimes(rounds);

			// Verify solveLayout was not called
			expect(solveLayout).not.toHaveBeenCalled();

			// Verify progress callback was not called
			expect(progressCallback).not.toHaveBeenCalled();

			// Verify finish callback was called with zeros
			expect(finishCallback).toHaveBeenCalledWith([0, 0]);
		});

		// the editor asks for 1000 rounds; one postMessage per round floods the main
		// thread with change detection for a counter the player reads as a running total
		it('should throttle progress reports for a long run', () => {
			const rounds = 1000;
			const mockStones = [{ z: 0, x: 0, y: 0, v: 1, groupNr: 1 }] as unknown as Array<Stone>;
			const builder = { build: vi.fn().mockReturnValue(mockStones) } as unknown as Builder;
			const solver = { solveLayout: vi.fn().mockReturnValue(0) } as unknown as Solver;
			const progressCallback = vi.fn();
			const finishCallback = vi.fn();

			statsSolveMapping([[0, 0, 0], [0, 2, 0]], rounds, progressCallback, finishCallback, solver, builder);

			expect(progressCallback.mock.calls.length).toBeLessThanOrEqual(MAX_PROGRESS_REPORTS);
			expect(progressCallback).toHaveBeenCalled();
			// the running total still climbs and finish reports every round
			expect(progressCallback.mock.calls.at(-1)?.[0][0]).toBeGreaterThan(progressCallback.mock.calls[0][0][0]);
			expect(finishCallback).toHaveBeenCalledWith([rounds, 0]);
		});

		it('should report every round when there are fewer rounds than the report budget', () => {
			const rounds = 5;
			const mockStones = [{ z: 0, x: 0, y: 0, v: 1, groupNr: 1 }] as unknown as Array<Stone>;
			const builder = { build: vi.fn().mockReturnValue(mockStones) } as unknown as Builder;
			const solver = { solveLayout: vi.fn().mockReturnValue(0) } as unknown as Solver;
			const progressCallback = vi.fn();

			statsSolveMapping([[0, 0, 0], [0, 2, 0]], rounds, progressCallback, vi.fn(), solver, builder);

			expect(progressCallback).toHaveBeenCalledTimes(rounds);
		});
	});
});
