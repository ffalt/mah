import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Mapping, Place } from '../model/types';
import { solveGame, statsSolveMapping } from '../model/tasks';
import { createStatsSolveWorker } from '../worker/create-stats-solve.worker';
import type { StonePosition } from '../model/stone';
import { createSolveWorker } from '../worker/create-solve.worker';
import { fromEvent, filter, map, share, take, takeUntil } from 'rxjs';

interface SolveGameResult {
	result: number;
	order: Array<Place>;
}

interface SolveGameMessage {
	result?: SolveGameResult;
}

interface StatsMessage {
	progress?: Array<number>;
	result?: Array<number>;
}

// Injectable seams for the worker factories and synchronous fallbacks so tests can
// supply stubs via DI instead of mocking the modules.
export const WORKER_FACTORIES = new InjectionToken<{ createSolveWorker: typeof createSolveWorker; createStatsSolveWorker: typeof createStatsSolveWorker }>('WORKER_FACTORIES', {
	providedIn: 'root',
	factory: () => ({ createSolveWorker, createStatsSolveWorker })
});

export const SOLVE_TASKS = new InjectionToken<{ solveGame: typeof solveGame; statsSolveMapping: typeof statsSolveMapping }>('SOLVE_TASKS', {
	providedIn: 'root',
	factory: () => ({ solveGame, statsSolveMapping })
});

@Injectable({ providedIn: 'root' })
export class WorkerService {
	private readonly factories = inject(WORKER_FACTORIES);
	private readonly tasks = inject(SOLVE_TASKS);

	solveGame(stones: Array<StonePosition>, finish: (data: SolveGameResult) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			const worker = this.factories.createSolveWorker();
			if (worker) {
				const messages$ = fromEvent<MessageEvent<SolveGameMessage>>(worker, 'message').pipe(
					map(event => event.data),
					share()
				);

				const result$ = messages$.pipe(
					map(d => d.result),
					filter((v): v is SolveGameResult => !!v),
					take(1)
				);

				// Final result handler auto-unsubscribes after first result and terminates the worker
				result$.subscribe(data => {
					finish(data);
					worker.terminate();
				});

				worker.addEventListener('error', () => {
					worker.terminate();
					this.tasks.solveGame(stones, finish);
				});

				worker.postMessage({ stones });
				return worker;
			}
		}
		// Web Workers not supported or worker creation failed - use synchronous fallback
		this.tasks.solveGame(stones, finish);
		return undefined;
	}

	solve(mapping: Mapping, rounds: number, callback: (progress: Array<number>) => void, finish: (result: Array<number>) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			const worker = this.factories.createStatsSolveWorker();
			if (worker) {
				const messages$ = fromEvent<MessageEvent<StatsMessage>>(worker, 'message').pipe(
					map(event => event.data),
					share()
				);

				const result$ = messages$.pipe(
					map(d => d.result),
					filter((v): v is Array<number> => Array.isArray(v)),
					take(1)
				);

				// Progress stream stops automatically when result arrives
				messages$.pipe(
					map(d => d.progress),
					filter((v): v is Array<number> => Array.isArray(v)),
					takeUntil(result$)
				).subscribe(progress => {
					callback(progress);
				});

				// Final result handler auto-unsubscribes and terminates the worker
				result$.subscribe(result => {
					finish(result);
					worker.terminate();
				});

				worker.addEventListener('error', () => {
					worker.terminate();
					this.tasks.statsSolveMapping(mapping, rounds, callback, finish);
				});

				worker.postMessage({ mapping, rounds });
				return worker;
			}
		}
		// Web Workers not supported or worker creation failed - use synchronous fallback
		this.tasks.statsSolveMapping(mapping, rounds, callback, finish);
		return undefined;
	}
}
