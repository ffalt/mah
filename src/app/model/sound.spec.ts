// Mock zzfx before importing the module that uses it
vi.mock('zzfx', () => ({ zzfx: vi.fn() }));

import { zzfx } from 'zzfx';
import { Sound, SOUNDS } from './sound';
import { Mock } from 'vitest';

describe('Sound', () => {
	let sound: Sound;
	const zzfxMock = zzfx as unknown as Mock;

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
