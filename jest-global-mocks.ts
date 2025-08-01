Object.defineProperty(window, 'CSS', { value: null });

Object.defineProperty(document, 'doctype', { value: '<!DOCTYPE html>' });

Object.defineProperty(window, 'getComputedStyle', {
	value: () => ({
		display: 'none',
		appearance: ['-webkit-appearance']
	})
});

// @ts-expect-error we just test the existence of getContext, no need to mock more
window.HTMLCanvasElement.prototype.getContext = () => ({});
window.HTMLCanvasElement.prototype.toDataURL = () => '';

Object.defineProperty(document.body.style, 'transform', {
	value: () => ({
		enumerable: true,
		configurable: true
	})
});

const mockBrowserStorage = () => {
	const storage = new Map<string, unknown>();
	return {
		getItem: (key: string) => storage.get(key),
		setItem: (key: string, value: string) => storage.set(key, value || ''),
		removeItem: (key: string) => storage.delete(key),
		clear: () => (storage.clear())
	};
};
Object.defineProperty(window, 'localStorage', { value: mockBrowserStorage() });
Object.defineProperty(window, 'sessionStorage', { value: mockBrowserStorage() });

jest.mock('./src/app/worker/create-stats-solve.worker.ts', () => ({
	createStatsSolveWorker: () => {
		// nope
	}
}));

jest.mock('./src/app/worker/create-solve.worker.ts', () => ({
	createSolveWorker: () => {
		// mope
	}
}));
