import {Injectable} from '@angular/core';
import {Mapping} from '../model/types';
import {statsSolveMapping} from '../model/tasks';

@Injectable({
	providedIn: 'root'
})
export class WorkerService {
	solve(mapping: Mapping, rounds: number, callback: (progress: Array<number>) => void, finish: (result: Array<number>) => void): Worker | undefined {
		if (typeof Worker !== 'undefined') {
			const worker = new Worker(new URL('../worker/stats-solve.worker', import.meta.url));
			worker.onmessage = ({data}) => {
				if (data.progress) {
					callback(data.progress);
				}
				if (data.result) {
					finish(data.result);
				}
			};
			worker.postMessage({mapping, rounds});
			return worker;
		}
		// Web workers are not supported in this environment.
		// You should add a fallback so that your program still executes correctly.
		statsSolveMapping(mapping, rounds, callback, finish);
		return;
	}
}
