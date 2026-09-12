import { Service } from '@angular/core';
import type { Mapping, Place } from '../model/types';
import { solveGame, statsSolveMapping } from '../model/tasks';
import { createStatsSolveWorker } from '../worker/create-stats-solve.worker';
import type { StonePosition } from '../model/stone';
import { createSolveWorker } from '../worker/create-solve.worker';
import { fromEvent, filter, map, share, take, takeUntil } from 'rxjs';
import { log } from '../model/log';

interface SolveGameResult {
	result: number;
	order: Array<Place>;
}

interface SolveGameMessage {
	result?: SolveGameResult;
	error?: string;
}

interface StatsMessage {
	progress?: Array<number>;
	result?: Array<number>;
	error?: string;
}

@Service()
export class WorkerService {
	solveGame(stones: Array<StonePosition>, finish: (data: SolveGameResult) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			try {
				const worker = createSolveWorker();
				const messages$ = fromEvent<MessageEvent<SolveGameMessage>>(worker, 'message').pipe(
					map(event => event.data),
					share()
				);

				const result$ = messages$.pipe(
					map(d => d.result),
					filter((v): v is SolveGameResult => !!v),
					take(1)
				);

				let settled = false;
				const settle = (data: SolveGameResult): void => {
					if (settled) {
						return;
					}
					settled = true;
					worker.terminate();
					finish(data);
				};

				result$.subscribe(data => {
					settle(data);
				});

				const abort = (reason: unknown): void => {
					if (settled) {
						return;
					}
					log.warn('solve worker failed:', reason);
					settle({ result: stones.length, order: [] });
				};

				messages$.pipe(
					map(d => d.error),
					filter((v): v is string => !!v),
					take(1)
				).subscribe(message => {
					abort(message);
				});

				worker.addEventListener('error', event => {
					abort(event);
				});

				worker.postMessage({ stones });
				return worker;
			} catch (error) {
				// worker creation can throw under a CSP/webview that blocks module workers; degrade to the main thread
				log.warn('solve worker creation failed, using synchronous fallback:', error);
			}
		}
		// Web Workers not supported or worker creation failed - use synchronous fallback
		solveGame(stones, finish);
		return undefined;
	}

	solve(mapping: Mapping, rounds: number, callback: (progress: Array<number>) => void, finish: (result: Array<number>) => void): Worker | undefined {
		if (mapping.length === 0 || mapping.length % 2 !== 0) {
			finish([0, rounds]);
			return undefined;
		}
		if (typeof Worker !== 'undefined') {
			try {
				const worker = createStatsSolveWorker();
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

				let settled = false;
				const settle = (result: Array<number>): void => {
					if (settled) {
						return;
					}
					settled = true;
					worker.terminate();
					finish(result);
				};

				result$.subscribe(result => {
					settle(result);
				});

				const abort = (reason: unknown): void => {
					if (settled) {
						return;
					}
					log.warn('stats solve worker failed:', reason);
					settle([0, 0]);
				};

				messages$.pipe(
					map(d => d.error),
					filter((v): v is string => !!v),
					take(1)
				).subscribe(message => {
					abort(message);
				});

				worker.addEventListener('error', event => {
					abort(event);
				});

				worker.postMessage({ mapping, rounds });
				return worker;
			} catch (error) {
				// worker creation can throw under a CSP/webview that blocks module workers; degrade to the main thread
				log.warn('stats solve worker creation failed, using synchronous fallback:', error);
			}
		}
		// Web Workers not supported or worker creation failed - use synchronous fallback
		statsSolveMapping(mapping, rounds, callback, finish);
		return undefined;
	}
}
