import { Injectable } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class WorkerService {
	solveGame(stones: Array<StonePosition>, finish: (data: SolveGameResult) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			const worker = createSolveWorker();
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

				worker.postMessage({ stones });
			}
			return worker;
		}
		solveGame(stones, finish);
		return;
	}

	solve(mapping: Mapping, rounds: number, callback: (progress: Array<number>) => void, finish: (result: Array<number>) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			const worker = createStatsSolveWorker();
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

				worker.postMessage({ mapping, rounds });
			}
			return worker;
		}
		// Web workers are not supported in this environment.
		// You should add a fallback so that your program still executes correctly.
		statsSolveMapping(mapping, rounds, callback, finish);
		return;
	}
}
