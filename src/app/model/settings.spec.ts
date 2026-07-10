import { Settings } from './settings';
import { ImageSetDefault, LangDefault, ThemeDefault } from './consts';
import type { SettingsStore, StorageProvider } from './types';
import { Mock, describe, beforeEach, it, expect, vi } from 'vitest';

describe('Settings', () => {
	let settings: Settings;
	let mockStorageProvider: StorageProvider;

	beforeEach(() => {
		// Create mock storage provider
		mockStorageProvider = {
			getSettings: vi.fn(),
			storeSettings: vi.fn(),
			getState: vi.fn(),
			storeState: vi.fn(),
			getScore: vi.fn(),
			storeScore: vi.fn()
		};

		// Create settings instance
		settings = new Settings(mockStorageProvider);
	});

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(settings).toBeTruthy();
		});

		it('should initialize with default values', () => {
			expect(settings.lang()).toBe(LangDefault);
			expect(settings.sounds()).toBe(true);
			expect(settings.tileset()).toBe(ImageSetDefault);
			expect(settings.music()).toBe(false);
			expect(settings.contrast()).toBe(false);
			expect(settings.dark()).toBe(false);
			expect(settings.tile3d()).toBe(false);
			expect(settings.background()).toBe('');
			expect(settings.theme()).toBe(ThemeDefault);
			expect(settings.stats).toEqual({
				games: 0,
				bestTime: 0
			});
		});
	});

	describe('load', () => {
		it('should load settings from storage', () => {
			const storedSettings: SettingsStore = {
				lang: 'de',
				sounds: false,
				music: true,
				contrast: true,
				dark: true,
				tile3d: true,
				background: 'test-background',
				theme: 'dkblue',
				tileset: 'test-tileset',
				kyodaiUrl: 'test-url'
			};

			(mockStorageProvider.getSettings as Mock).mockReturnValue(storedSettings);

			const result = settings.load();

			expect(result).toBe(true);
			expect(settings.lang()).toBe('de');
			expect(settings.sounds()).toBe(false);
			expect(settings.music()).toBe(true);
			expect(settings.contrast()).toBe(true);
			expect(settings.dark()).toBe(true);
			expect(settings.tile3d()).toBe(true);
			expect(settings.background()).toBe('test-background');
			expect(settings.theme()).toBe('dkblue');
			expect(settings.tileset()).toBe('test-tileset');
			expect(settings.kyodaiUrl()).toBe('test-url');
		});

		it('should use default values for missing settings', () => {
			(mockStorageProvider.getSettings as Mock).mockReturnValue({
				background: 'test-background'
			});

			const result = settings.load();

			expect(result).toBe(true);
			expect(settings.lang()).toBe(LangDefault);
			expect(settings.tileset()).toBe(ImageSetDefault);
			expect(settings.theme()).toBe(ThemeDefault);
			expect(settings.background()).toBe('test-background');
		});

		it('should fall back to default theme if saved theme does not exist', () => {
			(mockStorageProvider.getSettings as Mock).mockReturnValue({
				theme: 'nonexistent-theme'
			});

			const result = settings.load();

			expect(result).toBe(true);
			expect(settings.theme()).toBe(ThemeDefault);
		});

		it('should handle load failure', () => {
			(mockStorageProvider.getSettings as Mock).mockImplementation(() => {
				throw new Error('Test error');
			});

			const originalConsoleError = console.error;
			console.error = vi.fn();
			const result = settings.load();
			console.error = originalConsoleError;

			expect(result).toBe(false);
		});
	});

	describe('save', () => {
		it('should save settings to storage', () => {
			settings.lang.set('de');
			settings.sounds.set(false);
			settings.music.set(true);
			settings.contrast.set(true);
			settings.dark.set(true);
			settings.confetti.set(true);
			settings.tile3d.set(true);
			settings.background.set('test-background');
			settings.theme.set('test-theme');
			settings.tileset.set('test-tileset');
			settings.kyodaiUrl.set('test-url');

			const result = settings.save();

			expect(result).toBe(true);
			expect(mockStorageProvider.storeSettings).toHaveBeenCalledWith({
				lang: 'de',
				sounds: false,
				music: true,
				contrast: true,
				dark: true,
				confetti: true,
				showClock: true,
				tile3d: true,
				background: 'test-background',
				pattern: undefined,
				theme: 'test-theme',
				tileset: 'test-tileset',
				kyodaiUrl: 'test-url',
				tutorialCompleted: false
			});
		});

		it('should handle save failure', () => {
			(mockStorageProvider.storeSettings as Mock).mockImplementation(() => {
				throw new Error('Test error');
			});

			const originalConsoleError = console.error;
			console.error = vi.fn();
			const result = settings.save();
			console.error = originalConsoleError;

			expect(result).toBe(false);
		});
	});
});
