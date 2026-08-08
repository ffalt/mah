import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Confetti } from './confetti';

const mocks = vi.hoisted(() => {
	const state: { returnValue: unknown } = { returnValue: undefined };
	const spy = vi.fn((_options: unknown) => state.returnValue);
	return { state, spy };
});

vi.mock('canvas-confetti', () => {
	const confettiMock = mocks.spy;
	Object.assign(confettiMock, { shapeFromPath: () => ({ type: 'path' }) });
	return { default: confettiMock };
});

// trigger() picks one of seven modes with Math.floor(Math.random() * 7);
// pinning Math.random to (index + 0.5) / 7 selects a specific one
const MODE_COUNT = 7;
const modeNames = ['emoji', 'schoolPride', 'stars', 'fireworks', 'randomDirection', 'realistic', 'basic'];

describe('Confetti', () => {
	beforeEach(() => {
		mocks.spy.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	function runMode(index: number): void {
		vi.spyOn(Math, 'random').mockReturnValue((index + 0.5) / MODE_COUNT);
		new Confetti().trigger();
		// let the deferred shots (setTimeout / setInterval / requestAnimationFrame) run
		vi.advanceTimersByTime(2000);
	}

	describe('when canvas-confetti cannot create a canvas and returns null', () => {
		beforeEach(() => {
			mocks.state.returnValue = null;
			vi.useFakeTimers();
		});

		for (const [index, name] of modeNames.entries()) {
			it(`does not throw in ${name} mode`, () => {
				expect(() => runMode(index)).not.toThrow();
			});
		}

		it('still asks canvas-confetti to fire', () => {
			runMode(modeNames.indexOf('basic'));
			expect(mocks.spy).toHaveBeenCalled();
		});
	});

	describe('when canvas-confetti returns a promise', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		it('does not throw and swallows a rejection', async () => {
			mocks.state.returnValue = Promise.reject(new Error('canvas gone'));
			expect(() => runMode(modeNames.indexOf('basic'))).not.toThrow();
			vi.useRealTimers();
			await Promise.resolve();
		});

		it('does not throw for a resolving promise', () => {
			mocks.state.returnValue = Promise.resolve();
			expect(() => runMode(modeNames.indexOf('realistic'))).not.toThrow();
		});
	});
});
