import { Settings } from './settings';
import { ImageSetDefault, LangDefault, ThemeDefault } from './consts';
import type { SettingsStore, StorageProvider } from './types';

describe('Settings', () => {
	let settings: Settings;
	let mockStorageProvider: StorageProvider;

	beforeEach(() => {
		// Create mock storage provider
		mockStorageProvider = {
			getSettings: jest.fn(),
			storeSettings: jest.fn(),
			getState: jest.fn(),
			storeState: jest.fn(),
			getScore: jest.fn(),
			storeScore: jest.fn()
		} as unknown as StorageProvider;

		// Create settings instance
		settings = new Settings(mockStorageProvider);
	});

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(settings).toBeTruthy();
		});

		it('should initialize with default values', () => {
			expect(settings.lang).toBe(LangDefault);
			expect(settings.sounds).toBe(true);
			expect(settings.tileset).toBe(ImageSetDefault);
			expect(settings.music).toBe(false);
			expect(settings.contrast).toBe(false);
			expect(settings.dark).toBe(false);
			expect(settings.background).toBe('');
			expect(settings.theme).toBe(ThemeDefault);
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
				background: 'test-background',
				theme: 'test-theme',
				tileset: 'test-tileset',
				kyodaiUrl: 'test-url'
			};

			(mockStorageProvider.getSettings as jest.Mock).mockReturnValue(storedSettings);

			const result = settings.load();

			expect(result).toBe(true);
			expect(settings.lang).toBe('de');
			expect(settings.sounds).toBe(false);
			expect(settings.music).toBe(true);
			expect(settings.contrast).toBe(true);
			expect(settings.dark).toBe(true);
			expect(settings.background).toBe('test-background');
			expect(settings.theme).toBe('test-theme');
			expect(settings.tileset).toBe('test-tileset');
			expect(settings.kyodaiUrl).toBe('test-url');
		});

		it('should use default values for missing settings', () => {
			(mockStorageProvider.getSettings as jest.Mock).mockReturnValue({
				background: 'test-background'
			});

			const result = settings.load();

			expect(result).toBe(true);
			expect(settings.lang).toBe(LangDefault);
			expect(settings.tileset).toBe(ImageSetDefault);
			expect(settings.theme).toBe(ThemeDefault);
			expect(settings.background).toBe('test-background');
		});

		it('should handle load failure', () => {
			(mockStorageProvider.getSettings as jest.Mock).mockImplementation(() => {
				throw new Error('Test error');
			});

			const originalConsoleError = console.error;
			console.error = jest.fn();
			const result = settings.load();
			console.error = originalConsoleError;

			expect(result).toBe(false);
		});
	});

	describe('save', () => {
		it('should save settings to storage', () => {
			settings.lang = 'de';
			settings.sounds = false;
			settings.music = true;
			settings.contrast = true;
			settings.dark = true;
			settings.background = 'test-background';
			settings.theme = 'test-theme';
			settings.tileset = 'test-tileset';
			settings.kyodaiUrl = 'test-url';

			const result = settings.save();

			expect(result).toBe(true);
			expect(mockStorageProvider.storeSettings).toHaveBeenCalledWith({
				lang: 'de',
				sounds: false,
				music: true,
				contrast: true,
				dark: true,
				background: 'test-background',
				theme: 'test-theme',
				tileset: 'test-tileset',
				kyodaiUrl: 'test-url'
			});
		});

		it('should handle save failure', () => {
			(mockStorageProvider.storeSettings as jest.Mock).mockImplementation(() => {
				throw new Error('Test error');
			});

			const originalConsoleError = console.error;
			console.error = jest.fn();
			const result = settings.save();
			console.error = originalConsoleError;

			expect(result).toBe(false);
		});
	});
});
