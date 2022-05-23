import {solveGame} from '../model/tasks';

addEventListener('message', ({data}) => {
	if (data) {
		solveGame(data.stones,
			result => {
				postMessage({result});
			});
	}
});
