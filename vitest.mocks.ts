/* eslint-disable max-classes-per-file, @typescript-eslint/promise-function-async */

import { vi } from 'vitest';

Object.defineProperty(window, 'CSS', { value: null });

Object.defineProperty(document, 'doctype', { value: '<!DOCTYPE html>' });

Object.defineProperty(window, 'getComputedStyle', {
	value: () => ({
		display: 'none',
		appearance: ['-webkit-appearance']
	})
});

window.HTMLCanvasElement.prototype.getContext = vi.fn();
window.HTMLCanvasElement.prototype.toDataURL = vi.fn();

if (!window.HTMLElement.prototype.scrollTo) {
	window.HTMLElement.prototype.scrollTo = vi.fn();
}

if (!window.Element.prototype.scrollTo) {
	window.Element.prototype.scrollTo = vi.fn();
}

Object.defineProperty(document.body.style, 'transform', {
	value: () => ({
		enumerable: true,
		configurable: true
	})
});

const localStorageMock = (() => {
	const localStorage: Record<string, unknown> = {};
	Object.defineProperties(localStorage, {
		getItem: {
			value: (key: string) => (localStorage[key] === undefined) ? null : localStorage[key],
			writable: false,
			configurable: false,
			enumerable: false
		},
		setItem: {
			value: (sKey: string, sValue: unknown) => {
				localStorage[sKey] = sValue;
			},
			writable: false,
			configurable: false,
			enumerable: false
		},
		removeItem: {
			value: (sKey: string) => {
				delete localStorage[sKey];
			},
			writable: false,
			configurable: false,
			enumerable: false
		},
		length: {
			get: () => Object.keys(localStorage).length,
			configurable: false,
			enumerable: false
		},
		clear: {
			value: () => {
				for (const key of Object.keys(localStorage)) {
					delete localStorage[key];
				}
			},
			writable: false,
			configurable: false,
			enumerable: false
		}
	});

	return localStorage;
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Minimal Web Audio API mock so libraries (like zzfx) that use AudioContext work in tests.

class MockAudioBuffer {
	channels: Array<Float32Array>;
	sampleRate: number;
	length: number;

	constructor(numChannels: number, length: number, sampleRate: number) {
		this.length = length;
		this.sampleRate = sampleRate;
		this.channels = Array.from({ length: numChannels }, () => new Float32Array(length));
	}

	getChannelData(channel: number) {
		return this.channels[channel];
	}
}

class MockAudioBufferSourceNode {
	buffer: MockAudioBuffer | null = null;
	onended: ((event?: Event) => void) | null = null;
	playbackRate: { value: number } = { value: 1 };

	start(_when?: number) {
		// mock
	}

	stop(_when?: number) {
		if (this.onended) {
			this.onended();
		}
	}

	connect() {
		return this;
	}
}

class MockGainNode {
	gain = { value: 1 };

	connect() {
		return this;
	}

	disconnect() {
		// mock
	}
}

class MockStereoPannerNode {
	pan = { value: 0 };

	connect() {
		return this;
	}

	disconnect() {
		// mocked
	}
}

class MockAudioContext {
	sampleRate = 44_100;
	currentTime = 0;

	createBuffer(numChannels: number, length: number, sampleRate: number) {
		return new MockAudioBuffer(numChannels, length, sampleRate);
	}

	createBufferSource() {
		return new MockAudioBufferSourceNode();
	}

	createGain() {
		return new MockGainNode();
	}

	createStereoPanner() {
		return new MockStereoPannerNode();
	}

	decodeAudioData(_arrayBuffer: ArrayBuffer, success?: (buffer: MockAudioBuffer) => void, _error?: (error?: unknown) => void) {
		if (success) {
			success(new MockAudioBuffer(1, 1, this.sampleRate));
		}
		return Promise.resolve(new MockAudioBuffer(1, 1, this.sampleRate));
	}

	resume() {
		return Promise.resolve();
	}

	close() {
		return Promise.resolve();
	}
}

Object.defineProperties(window, {
	AudioContext: { value: MockAudioContext },
	webkitAudioContext: { value: MockAudioContext },
	StereoPannerNode: { value: MockStereoPannerNode }
});
Object.defineProperty(global, 'Audio', {
	value: vi.fn().mockImplementation(() => ({
		src: '',
		load: vi.fn(),
		play: vi.fn().mockReturnValue(Promise.resolve()),
		pause: vi.fn()
	}))
});
