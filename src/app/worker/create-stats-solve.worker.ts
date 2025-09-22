export function createStatsSolveWorker(): Worker {
	return new Worker(new URL('./stats-solve.worker', import.meta.url), { type: 'module' });
}
