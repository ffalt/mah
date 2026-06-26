import { TestBed } from '@angular/core/testing';
import { SOLVE_TASKS, WORKER_FACTORIES, WorkerService } from './worker.service';
import type { StonePosition } from '../model/stone';
import type { Mapping } from '../model/types';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

class FakeWorker {}

class MockWorker extends EventTarget {
	postMessage = vi.fn();
	terminate = vi.fn();
}

describe('WorkerService', () => {
	let service: WorkerService;
	let originalWorker: typeof Worker;
	let mockTasks: { solveGame: ReturnType<typeof vi.fn>; statsSolveMapping: ReturnType<typeof vi.fn> };
	let mockFactories: { createSolveWorker: ReturnType<typeof vi.fn>; createStatsSolveWorker: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		mockTasks = {
			solveGame: vi.fn(),
			statsSolveMapping: vi.fn()
		};
		mockFactories = {
			createSolveWorker: vi.fn(),
			createStatsSolveWorker: vi.fn()
		};
		TestBed.configureTestingModule({
			providers: [
				WorkerService,
				{ provide: SOLVE_TASKS, useValue: mockTasks },
				{ provide: WORKER_FACTORIES, useValue: mockFactories }
			]
		});
		service = TestBed.inject(WorkerService);
		originalWorker = global.Worker;
	});

	afterEach(() => {
		global.Worker = originalWorker;
	});

	describe('solveGame', () => {
		it('should create service', () => {
			expect(service).toBeTruthy();
		});

		it('should call fallback when Worker is not available', () => {
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = vi.fn();

			// @ts-expect-error - Mocking Worker
			global.Worker = undefined;

			const result = service.solveGame(stones, finish);

			expect(result).toBeUndefined();
			expect(mockTasks.solveGame).toHaveBeenCalledWith(stones, finish);
		});

		it('should return undefined and call fallback when worker creation fails', () => {
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = vi.fn();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createSolveWorker.mockReturnValue(null);

			const result = service.solveGame(stones, finish);

			expect(result).toBeUndefined();
			expect(mockTasks.solveGame).toHaveBeenCalledWith(stones, finish);
		});

		it('should return worker and call finish when result message is received', () => {
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = vi.fn();
			const mockWorker = new MockWorker();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createSolveWorker.mockReturnValue(mockWorker);

			const result = service.solveGame(stones, finish);

			expect(result).toBe(mockWorker);
			expect(mockWorker.postMessage).toHaveBeenCalledWith({ stones });

			const solveResult = { result: 1, order: [] };
			mockWorker.dispatchEvent(new MessageEvent('message', { data: { result: solveResult } }));

			expect(finish).toHaveBeenCalledWith(solveResult);
			expect(mockWorker.terminate).toHaveBeenCalled();
		});

		it('should ignore messages without result', () => {
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = vi.fn();
			const mockWorker = new MockWorker();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createSolveWorker.mockReturnValue(mockWorker);

			service.solveGame(stones, finish);

			mockWorker.dispatchEvent(new MessageEvent('message', { data: {} }));

			expect(finish).not.toHaveBeenCalled();
			expect(mockWorker.terminate).not.toHaveBeenCalled();
		});

		it('should call fallback and terminate on worker error', () => {
			const stones: Array<StonePosition> = [
				{ x: 0, y: 0, z: 0, v: 1, groupNr: 1 }
			];
			const finish = vi.fn();
			const mockWorker = new MockWorker();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createSolveWorker.mockReturnValue(mockWorker);

			service.solveGame(stones, finish);

			mockWorker.dispatchEvent(new Event('error'));

			expect(mockWorker.terminate).toHaveBeenCalled();
			expect(mockTasks.solveGame).toHaveBeenCalledWith(stones, finish);
		});
	});

	describe('solve', () => {
		it('should call fallback when Worker is not available', () => {
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 10;
			const callback = vi.fn();
			const finish = vi.fn();

			// @ts-expect-error - Mocking Worker
			global.Worker = undefined;

			const result = service.solve(mapping, rounds, callback, finish);

			expect(result).toBeUndefined();
			expect(mockTasks.statsSolveMapping).toHaveBeenCalledWith(mapping, rounds, callback, finish);
		});

		it('should return undefined and call fallback when worker creation fails', () => {
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 10;
			const callback = vi.fn();
			const finish = vi.fn();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createStatsSolveWorker.mockReturnValue(null);

			const result = service.solve(mapping, rounds, callback, finish);

			expect(result).toBeUndefined();
			expect(mockTasks.statsSolveMapping).toHaveBeenCalledWith(mapping, rounds, callback, finish);
		});

		it('should return worker, call callback on progress, and call finish when result is received', () => {
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 10;
			const callback = vi.fn();
			const finish = vi.fn();
			const mockWorker = new MockWorker();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createStatsSolveWorker.mockReturnValue(mockWorker);

			const result = service.solve(mapping, rounds, callback, finish);

			expect(result).toBe(mockWorker);
			expect(mockWorker.postMessage).toHaveBeenCalledWith({ mapping, rounds });

			const progress = [1, 2, 3];
			mockWorker.dispatchEvent(new MessageEvent('message', { data: { progress } }));

			expect(callback).toHaveBeenCalledWith(progress);
			expect(finish).not.toHaveBeenCalled();

			const solveResult = [10, 20, 30];
			mockWorker.dispatchEvent(new MessageEvent('message', { data: { result: solveResult } }));

			expect(finish).toHaveBeenCalledWith(solveResult);
			expect(mockWorker.terminate).toHaveBeenCalled();
		});

		it('should stop receiving progress after result is received', () => {
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 5;
			const callback = vi.fn();
			const finish = vi.fn();
			const mockWorker = new MockWorker();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createStatsSolveWorker.mockReturnValue(mockWorker);

			service.solve(mapping, rounds, callback, finish);

			mockWorker.dispatchEvent(new MessageEvent('message', { data: { result: [1, 2] } }));

			expect(finish).toHaveBeenCalledTimes(1);

			mockWorker.dispatchEvent(new MessageEvent('message', { data: { progress: [3, 4] } }));

			expect(callback).not.toHaveBeenCalled();
		});

		it('should call fallback and terminate on worker error', () => {
			const mapping: Mapping = [[0, 0, 0]];
			const rounds = 10;
			const callback = vi.fn();
			const finish = vi.fn();
			const mockWorker = new MockWorker();

			// @ts-expect-error - Mocking Worker
			global.Worker = FakeWorker;
			mockFactories.createStatsSolveWorker.mockReturnValue(mockWorker);

			service.solve(mapping, rounds, callback, finish);

			mockWorker.dispatchEvent(new Event('error'));

			expect(mockWorker.terminate).toHaveBeenCalled();
			expect(mockTasks.statsSolveMapping).toHaveBeenCalledWith(mapping, rounds, callback, finish);
		});
	});
});
