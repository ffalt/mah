import { solveGame } from '../model/tasks';

addEventListener('message', ({ data }) => {
	if (data) {
		try {
			solveGame(data.stones,
				result => {
					postMessage({ result });
				});
		} catch (error) {
			postMessage({ error: error instanceof Error ? error.message : 'solve failed' });
		}
	}
});
