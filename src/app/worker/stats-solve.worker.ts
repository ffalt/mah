import { statsSolveMapping } from '../model/tasks';

addEventListener('message', ({ data }) => {
	if (data) {
		try {
			statsSolveMapping(data.mapping, data.rounds,
				(progress: Array<number>) => {
					postMessage({ progress });
				},
				(result: Array<number>) => {
					postMessage({ result });
				});
		} catch (error) {
			postMessage({ error: error instanceof Error ? error.message : 'stats solve failed' });
		}
	}
});
