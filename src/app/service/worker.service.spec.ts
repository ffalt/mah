import { TestBed } from '@angular/core/testing';
import { WorkerService } from './worker.service';
import type { StonePosition } from '../model/stone';
import type { Mapping } from '../model/types';
import * as tasks from '../model/tasks';

jest.mock('../model/tasks', () => ({
	solveGame: jest.fn(),
	statsSolveMapping: jest.fn()
}));

jest.mock('../worker/create-solve.worker', () => ({
	createSolveWorker: jest.fn()
}));

jest.mock('../worker/create-stats-solve.worker', () => ({
	createStatsSolveWorker: jest.fn()
}));

import { createSolveWorker } from '../worker/create-solve.worker';
import { createStatsSolveWorker } from '../worker/create-stats-solve.worker';

describe('WorkerService', () => {
	let service: WorkerService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [WorkerService]
		});
		service = TestBed.inject(WorkerService);
		jest.clearAllMocks();
	});

	describe('solveGame', () => {
		it('should create service', () => {
			expect(service).toBeTruthy();
		});

		it('should call fallback when Worker is not available', () => {
			// Arrange
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = jest.fn();

			// Mock Worker as undefined
			const originalWorker = global.Worker;
			// @ts-expect-error - Mocking Worker
			global.Worker = undefined;

			// Act
			const result = service.solveGame(stones, finish);

			// Assert
			expect(result).toBeUndefined();
			expect(tasks.solveGame).toHaveBeenCalledWith(stones, finish);

			// Cleanup
			global.Worker = originalWorker;
		});

		it('should return undefined and call fallback when worker creation fails', () => {
			// Arrange
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = jest.fn();

			// Mock createSolveWorker to return null/undefined
			(createSolveWorker as jest.Mock).mockReturnValue(null);

			// Act
			const result = service.solveGame(stones, finish);

			// Assert
			expect(result).toBeUndefined();
			expect(tasks.solveGame).toHaveBeenCalledWith(stones, finish);
		});
	});

	describe('solve', () => {
		it('should call fallback when Worker is not available', () => {
			// Arrange
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 10;
			const callback = jest.fn();
			const finish = jest.fn();

			// Mock Worker as undefined
			const originalWorker = global.Worker;
			// @ts-expect-error - Mocking Worker
			global.Worker = undefined;

			// Act
			const result = service.solve(mapping, rounds, callback, finish);

			// Assert
			expect(result).toBeUndefined();
			expect(tasks.statsSolveMapping).toHaveBeenCalledWith(mapping, rounds, callback, finish);

			// Cleanup
			global.Worker = originalWorker;
		});

		it('should return undefined and call fallback when worker creation fails', () => {
			// Arrange
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 10;
			const callback = jest.fn();
			const finish = jest.fn();

			// Mock createStatsSolveWorker to return null/undefined
			(createStatsSolveWorker as jest.Mock).mockReturnValue(null);

			// Act
			const result = service.solve(mapping, rounds, callback, finish);

			// Assert
			expect(result).toBeUndefined();
			expect(tasks.statsSolveMapping).toHaveBeenCalledWith(mapping, rounds, callback, finish);
		});
	});
});
