import { Injectable } from '@angular/core';
import type { Mapping, Place } from '../model/types';
import { solveGame, statsSolveMapping } from '../model/tasks';
import { createStatsSolveWorker } from '../worker/create-stats-solve.worker';
import type { StonePosition } from '../model/stone';
import { createSolveWorker } from '../worker/create-solve.worker';

@Injectable({ providedIn: 'root' })
export class WorkerService {
	solveGame(stones: Array<StonePosition>, finish: (data: { result: number; order: Array<Place> }) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			const worker = createSolveWorker();
			if (worker) {
				worker.addEventListener('message', message => {
					if (message.data.result) {
						finish(message.data.result);
					}
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
				worker.addEventListener('message', message => {
					if (message.data.progress) {
						callback(message.data.progress);
					}
					if (message.data.result) {
						finish(message.data.result);
					}
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
