import 'jest-preset-angular';

/* global mocks for jsdom */
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
Object.defineProperty(window, 'getComputedStyle', {value: () => ['-webkit-appearance']});

Object.defineProperty(document.body.style, 'transform', {
	value: () => ({enumerable: true, configurable: true})
});

/* output shorter and more meaningful Zone error stack traces */
// Error.stackTraceLimit = 2;
