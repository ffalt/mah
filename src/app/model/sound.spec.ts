// Mock zzfx before importing the module that uses it
jest.mock('zzfx', () => ({ zzfx: jest.fn() }));

import { zzfx } from 'zzfx';
import { Sound, SOUNDS } from './sound';

describe('Sound', () => {
	let sound: Sound;
	const zzfxMock = zzfx as unknown as jest.Mock;

	beforeEach(() => {
		// Reset mock
		zzfxMock.mockClear();

		// Create sound instance
		sound = new Sound();
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
		it('should call zzfx with the sound parameters', () => {
			sound.play(SOUNDS.SELECT);

			expect(zzfxMock).toHaveBeenCalled();
			expect(zzfxMock).toHaveBeenCalledWith(...SOUNDS.SELECT);
		});

		it('should not call zzfx when disabled', () => {
			sound.enabled = false;
			sound.play(SOUNDS.SELECT);

			expect(zzfxMock).not.toHaveBeenCalled();
		});

		it('should propagate not errors from zzfx', () => {
			zzfxMock.mockImplementation(() => {
				throw new Error('Test error');
			});

			expect(() => sound.play(SOUNDS.SELECT)).not.toThrow('Test error');
		});
	});
});
