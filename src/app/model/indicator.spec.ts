import { Indicator } from './indicator';

describe('Indicator', () => {
	let indicator: Indicator;

	beforeEach(() => {
		jest.useFakeTimers();
		indicator = new Indicator();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should initialize with empty gestureIndicators', () => {
		expect(indicator.gestureIndicators).toEqual([]);
	});

	describe('display', () => {
		it('should add an indicator and return it', () => {
			const result = indicator.display(100, 200, 30);
			expect(indicator.gestureIndicators).toHaveLength(1);
			expect(result).toBe(indicator.gestureIndicators[0]);
		});

		it('should set x, y, and size', () => {
			const result = indicator.display(100, 200, 30)!;
			expect(result.x).toBe(100);
			expect(result.y).toBe(200);
			expect(result.size).toBe(30);
		});

		it('should compute top and left from center and size', () => {
			const result = indicator.display(100, 200, 30)!;
			expect(result.top).toBe(185); // 200 - 30/2
			expect(result.left).toBe(85); // 100 - 30/2
		});

		it('should start with state "hidden"', () => {
			const result = indicator.display(100, 200, 30)!;
			expect(result.state).toBe('hidden');
		});

		it('should transition to "visible" after 100ms', () => {
			const result = indicator.display(100, 200, 30)!;
			jest.advanceTimersByTime(100);
			expect(result.state).toBe('visible');
		});

		it('should return undefined when x is 0', () => {
			const result = indicator.display(0, 200, 30);
			expect(result).toBeUndefined();
			expect(indicator.gestureIndicators).toHaveLength(0);
		});

		it('should return undefined when y is 0', () => {
			const result = indicator.display(100, 0, 30);
			expect(result).toBeUndefined();
			expect(indicator.gestureIndicators).toHaveLength(0);
		});

		it('should support multiple concurrent indicators', () => {
			indicator.display(100, 100, 20);
			indicator.display(200, 200, 40);
			expect(indicator.gestureIndicators).toHaveLength(2);
		});
	});

	describe('hide', () => {
		it('should do nothing when given undefined', () => {
			indicator.display(100, 200, 30);
			indicator.hide(undefined);
			expect(indicator.gestureIndicators).toHaveLength(1);
		});

		it('should set state to "hidden" after 500ms', () => {
			const gi = indicator.display(100, 200, 30)!;
			jest.advanceTimersByTime(100); // become visible
			indicator.hide(gi);
			jest.advanceTimersByTime(500);
			expect(gi.state).toBe('hidden');
		});

		it('should remove indicator after 750ms total (500ms hide + 250ms remove)', () => {
			const gi = indicator.display(100, 200, 30)!;
			indicator.hide(gi);
			jest.advanceTimersByTime(750);
			expect(indicator.gestureIndicators).toHaveLength(0);
		});

		it('should not remove indicator before 750ms', () => {
			const gi = indicator.display(100, 200, 30)!;
			indicator.hide(gi);
			jest.advanceTimersByTime(600);
			expect(indicator.gestureIndicators).toHaveLength(1);
		});

		it('should cancel and restart the hide timer when called again', () => {
			const gi = indicator.display(100, 200, 30)!;
			jest.advanceTimersByTime(100);
			indicator.hide(gi);
			jest.advanceTimersByTime(300); // partway through first timer
			indicator.hide(gi); // restart
			jest.advanceTimersByTime(500); // 500ms from second hide call
			expect(gi.state).toBe('hidden');
		});

		it('should find indicator by coordinate match when reference is not in array', () => {
			const gi = indicator.display(100, 200, 30)!;
			// pass a plain object matching coordinates
			indicator.hide({ state: gi.state, x: 100, y: 200 });
			jest.advanceTimersByTime(750);
			expect(indicator.gestureIndicators).toHaveLength(0);
		});
	});

	describe('setSize', () => {
		it('should update size and recalculate top and left', () => {
			indicator.display(100, 200, 30);
			indicator.setSize(0, 60);
			const gi = indicator.gestureIndicators[0];
			expect(gi.size).toBe(60);
			expect(gi.top).toBe(170); // 200 - 60/2
			expect(gi.left).toBe(70); // 100 - 60/2
		});
	});

	describe('removeIndicator', () => {
		it('should remove an indicator matching coordinates', () => {
			const gi = indicator.display(100, 200, 30)!;
			indicator.removeIndicator(gi);
			expect(indicator.gestureIndicators).toHaveLength(0);
		});

		it('should not remove an indicator with non-matching coordinates', () => {
			indicator.display(100, 200, 30);
			indicator.removeIndicator({ state: 'hidden', x: 999, y: 999 });
			expect(indicator.gestureIndicators).toHaveLength(1);
		});

		it('should cancel pending hide timers when removing', () => {
			const gi = indicator.display(100, 200, 30)!;
			indicator.hide(gi);
			indicator.removeIndicator(gi);
			// Advancing time should not cause errors after removal
			expect(() => jest.advanceTimersByTime(1000)).not.toThrow();
			expect(indicator.gestureIndicators).toHaveLength(0);
		});

		it('should only remove the first indicator matching coordinates', () => {
			indicator.display(100, 200, 30);
			indicator.display(100, 200, 50); // duplicate coordinates, different size
			indicator.removeIndicator({ state: 'hidden', x: 100, y: 200 });
			expect(indicator.gestureIndicators).toHaveLength(1);
		});
	});
});
