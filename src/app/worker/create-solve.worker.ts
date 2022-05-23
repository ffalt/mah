export function createSolveWorker(): Worker {
	return new Worker(new URL('./solve.worker', import.meta.url));
}
