import { Sound, SOUNDS } from './sound';

describe('Sound', () => {
	let sound: Sound;
	let mockAudio: {
		src: string;
		load: jest.Mock;
		play: jest.Mock;
		pause: jest.Mock;
	};
	let originalAudio: new(source?: string) => HTMLAudioElement;

	beforeEach(() => {
		// Mock Audio API
		mockAudio = {
			src: '',
			load: jest.fn(),
			play: jest.fn().mockReturnValue(Promise.resolve()),
			pause: jest.fn()
		};
		originalAudio = global.Audio;
		global.Audio = jest.fn().mockImplementation(() => mockAudio);

		// Create sound instance
		sound = new Sound();
	});

	afterEach(() => {
		// Restore Audio API
		global.Audio = originalAudio;
	});

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(sound).toBeTruthy();
		});

		it('should initialize with sound enabled', () => {
			expect(sound.enabled).toBe(true);
		});
	});

	describe('play', () => {
		it('should create and play a sound', () => {
			sound.play(SOUNDS.SELECT);

			expect(global.Audio).toHaveBeenCalled();
			expect(mockAudio.src).toBe('assets/sounds/select.ogg');
			expect(mockAudio.load).toHaveBeenCalled();
			expect(mockAudio.play).toHaveBeenCalled();
		});

		it('should reuse existing audio player for the same sound', () => {
			sound.play(SOUNDS.SELECT);

			// Clear mocks to check second call
			jest.clearAllMocks();

			sound.play(SOUNDS.SELECT);

			// Should not create a new Audio instance
			expect(global.Audio).not.toHaveBeenCalled();
			// But should still play the sound
			expect(mockAudio.play).toHaveBeenCalled();
		});

		it('should not play sound when disabled', () => {
			sound.enabled = false;
			sound.play(SOUNDS.SELECT);

			expect(global.Audio).not.toHaveBeenCalled();
			expect(mockAudio.play).not.toHaveBeenCalled();
		});

		it('should handle play errors', () => {
			// Mock console.error to prevent test output noise
			const originalConsoleError = console.error;
			console.error = jest.fn();

			// Mock play to reject
			mockAudio.play.mockReturnValue(Promise.reject(new Error('Test error')));

			sound.play(SOUNDS.SELECT);

			setTimeout(() => {
				// Restore console.error
				console.error = originalConsoleError;
			});

			// Should still attempt to play
			expect(mockAudio.play).toHaveBeenCalled();
		});
	});

	describe('pause', () => {
		it('should pause a playing sound', () => {
			// First play a sound to create the audio player
			sound.play(SOUNDS.SELECT);

			// Then pause it
			sound.pause(SOUNDS.SELECT);

			expect(mockAudio.pause).toHaveBeenCalled();
		});

		it('should do nothing if sound was not played', () => {
			sound.pause(SOUNDS.SELECT);

			expect(mockAudio.pause).not.toHaveBeenCalled();
		});
	});

	describe('SOUNDS', () => {
		it('should define sound constants', () => {
			expect(SOUNDS.NOPE).toBe('invalid');
			expect(SOUNDS.SELECT).toBe('select');
			expect(SOUNDS.MATCH).toBe('match');
			expect(SOUNDS.OVER).toBe('over');
		});
	});
});
