import { solveGame, statsSolveMapping } from './tasks';
import { Solver } from './solver';
import { Builder, MODE_SOLVABLE } from './builder';
import { Tiles } from './tiles';
import type { StonePosition } from './stone';
import type { Mapping, Place } from './types';

// Mock dependencies
jest.mock('./solver');
jest.mock('./builder');
jest.mock('./tiles');

describe('Tasks', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('solveGame', () => {
    it('should solve a game and call the finish callback with the result', () => {
      // Setup mock data
      const stones: Array<StonePosition> = [
        { x: 0, y: 0, z: 0, v: 1, groupNr: 1 },
        { x: 1, y: 0, z: 0, v: 1, groupNr: 1 }
      ];
      const mockResult = 0; // Solvable
      const mockOrder: Array<Place> = [[0, 0, 0], [0, 1, 0]];

      // Setup mocks
      (Solver.prototype.solveLayout as jest.Mock).mockReturnValue(mockResult);
      (Solver.prototype.writeGame as jest.Mock).mockReturnValue(mockOrder);

      // Create finish callback mock
      const finishCallback = jest.fn();

      // Call the function
      solveGame(stones, finishCallback);

      // Verify solver was called with the stones
      expect(Solver.prototype.solveLayout).toHaveBeenCalledWith(stones);

      // Verify writeGame was called
      expect(Solver.prototype.writeGame).toHaveBeenCalled();

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

      // Setup mocks
      (Builder.prototype.build as jest.Mock).mockReturnValue(mockStones);

      // First round: solvable
      (Solver.prototype.solveLayout as jest.Mock).mockReturnValueOnce(0);
      // Second round: unsolvable
      (Solver.prototype.solveLayout as jest.Mock).mockReturnValueOnce(2);
      // Third round: solvable
      (Solver.prototype.solveLayout as jest.Mock).mockReturnValueOnce(0);

      // Create callback mocks
      const progressCallback = jest.fn();
      const finishCallback = jest.fn();

      // Call the function
      statsSolveMapping(mapping, rounds, progressCallback, finishCallback);

      // Verify Tiles constructor was called with mapping length
      expect(Tiles).toHaveBeenCalledWith(mapping.length);

      // Verify Builder was constructed with the Tiles instance
      expect(Builder).toHaveBeenCalled();

      // Verify build was called for each round
      expect(Builder.prototype.build).toHaveBeenCalledTimes(rounds);
      expect(Builder.prototype.build).toHaveBeenCalledWith(MODE_SOLVABLE, mapping);

      // Verify solveLayout was called for each round
      expect(Solver.prototype.solveLayout).toHaveBeenCalledTimes(rounds);
      expect(Solver.prototype.solveLayout).toHaveBeenCalledWith(mockStones);

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

      // Setup mocks
      (Builder.prototype.build as jest.Mock).mockReturnValue(undefined);

      // Create callback mocks
      const progressCallback = jest.fn();
      const finishCallback = jest.fn();

      // Call the function
      statsSolveMapping(mapping, rounds, progressCallback, finishCallback);

      // Verify build was called
      expect(Builder.prototype.build).toHaveBeenCalledTimes(rounds);

      // Verify solveLayout was not called
      expect(Solver.prototype.solveLayout).not.toHaveBeenCalled();

      // Verify progress callback was not called
      expect(progressCallback).not.toHaveBeenCalled();

      // Verify finish callback was called with zeros
      expect(finishCallback).toHaveBeenCalledWith([0, 0]);
    });
  });
});
