import {statsSolveMapping} from '../model/tasks';

addEventListener('message', ({data}) => {
	if (data) {
		statsSolveMapping(data.mapping, data.rounds,
			(progress: Array<number>) => {
				postMessage({progress});
			},
			(result: Array<number>) => {
				postMessage({result});
			});
	}
});
