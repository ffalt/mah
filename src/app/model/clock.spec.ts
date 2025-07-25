import { Clock } from './clock';

describe('Clock', () => {
	let clock: Clock;
	let originalSetTimeout: typeof window.setTimeout;
	let originalClearTimeout: typeof window.clearTimeout;
	let mockSetTimeout: jest.Mock;
	let mockClearTimeout: jest.Mock;
	let dateNowSpy: jest.SpyInstance;

	beforeEach(() => {
		clock = new Clock();

		// Mock setTimeout and clearTimeout
		originalSetTimeout = window.setTimeout;
		originalClearTimeout = window.clearTimeout;
		mockSetTimeout = jest.fn().mockReturnValue(123); // Return a fake timer ID
		mockClearTimeout = jest.fn();
		window.setTimeout = mockSetTimeout as unknown as typeof window.setTimeout;
		window.clearTimeout = mockClearTimeout as unknown as typeof window.clearTimeout;

		// Mock Date.now
		dateNowSpy = jest.spyOn(Date, 'now');
		dateNowSpy.mockReturnValue(1000); // Initial time
	});

	afterEach(() => {
		// Restore original functions
		window.setTimeout = originalSetTimeout;
		window.clearTimeout = originalClearTimeout;
		dateNowSpy.mockRestore();
	});

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(clock).toBeTruthy();
		});

		it('should initialize with zero elapsed time', () => {
			expect(clock.elapsed).toBe(0);
		});
	});

	describe('start', () => {
		it('should initialize elapsed time if not set', () => {
			clock.elapsed = undefined as unknown as number;
			clock.start();
			expect(clock.elapsed).toBe(0);
		});

		it('should keep existing elapsed time if set', () => {
			clock.elapsed = 5000;
			clock.start();
			expect(clock.elapsed).toBe(5000);
		});
	});

	describe('reset', () => {
		it('should reset elapsed time to zero', () => {
			clock.elapsed = 5000;
			clock.reset();
			expect(clock.elapsed).toBe(0);
		});

		it('should clear the timer if running', () => {
			// Setup a running timer
			clock.run();
			expect(mockSetTimeout).toHaveBeenCalled();

			clock.reset();

			expect(mockClearTimeout).toHaveBeenCalledWith(123);
		});
	});

	describe('run', () => {
		it('should start the timer', () => {
			clock.run();

			expect(mockSetTimeout).toHaveBeenCalled();
			expect(mockSetTimeout.mock.calls[0][1]).toBe(1000); // Check timeout duration
		});

		it('should not start a new timer if already running', () => {
			clock.run();
			mockSetTimeout.mockClear();

			clock.run();

			expect(mockSetTimeout).not.toHaveBeenCalled();
		});
	});

	describe('pause', () => {
		it('should clear the timer', () => {
			clock.run();
			clock.pause();

			expect(mockClearTimeout).toHaveBeenCalledWith(123);
		});

		it('should update elapsed time', () => {
			clock.run();

			// Simulate time passing
			dateNowSpy.mockReturnValue(3000);

			clock.pause();

			expect(clock.elapsed).toBe(2000); // 3000 - 1000 = 2000
		});

		it('should do nothing if not running', () => {
			clock.pause();

			expect(mockClearTimeout).not.toHaveBeenCalled();
			expect(clock.elapsed).toBe(0);
		});
	});

	describe('step', () => {
		it('should update elapsed time and set a new timer', () => {
			clock.run();

			// Save a reference to the callback function
			const stepCallback = mockSetTimeout.mock.calls[0][0];

			// Clear mocks to check only the step function calls
			mockSetTimeout.mockClear();

			// Simulate time passing
			dateNowSpy.mockReturnValue(2500);

			// Call the step method directly through the timer callback
			stepCallback();

			// Check elapsed time was updated
			expect(clock.elapsed).toBe(1500); // 2500 - 1000 = 1500

			// Check a new timer was set
			expect(mockSetTimeout).toHaveBeenCalled();
		});
	});
});
