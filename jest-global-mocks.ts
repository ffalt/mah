/* global mocks for jsdom */

// eslint-disable-next-line no-null/no-null
Object.defineProperty(window, 'CSS', {value: null});
Object.defineProperty(document, 'doctype', {
	value: '<!DOCTYPE html>'
});
Object.defineProperty(window, 'getComputedStyle', {
	value: () => ({
		display: 'none',
		appearance: ['-webkit-appearance']
	})
});

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
	value: () => ({
		enumerable: true,
		configurable: true
	})
});

const mock = () => {
	const storage = new Map<string, any>();
	return {
		getItem: (key: string) => storage.get(key),
		setItem: (key: string, value: string) => storage.set(key, value || ''),
		removeItem: (key: string) => storage.delete(key),
		clear: () => (storage.clear())
	};
};

Object.defineProperty(window, 'localStorage', {value: mock()});
Object.defineProperty(window, 'sessionStorage', {value: mock()});

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

/* output shorter and more meaningful Zone error stack traces */
// Error.stackTraceLimit = 2;
