import { TestBed } from '@angular/core/testing';
import { AppService } from './app.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Game } from '../model/game';
import { Settings } from '../model/settings';
import { LocalstorageService } from './localstorage.service';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/languages';
import { LangAuto } from '../model/consts';
import type { Sound } from '../model/sound';
import type { Music } from '../model/music';

// Mock modules
jest.mock('../model/game');
jest.mock('../model/settings');

describe('AppService', () => {
	let service: AppService;
	let translateService: jest.Mocked<TranslateService>;
	let mockGame: jest.Mocked<Game>;
	let mockSettings: jest.Mocked<Settings>;
	let mockStorage: jest.Mocked<LocalstorageService>;
	let originalNavigator: Navigator;

	beforeEach(() => {
		// Save original navigator
		originalNavigator = window.navigator;
		Object.defineProperty(window, 'navigator', {
			value: {
				language: 'en-US'
			},
			writable: true
		});

		// Create mocks for dependencies
		translateService = {
			use: jest.fn(),
			setTranslation: jest.fn(),
			setFallbackLang: jest.fn()
		} as unknown as jest.Mocked<TranslateService>;

		mockStorage = {} as jest.Mocked<LocalstorageService>;

		mockGame = new Game(mockStorage) as jest.Mocked<Game>;
		mockGame.init = jest.fn();
		mockGame.sound = { enabled: false } as jest.Mocked<Sound>;
		mockGame.music = {
			enabled: false,
			toggle: jest.fn(),
			play: jest.fn(),
			pause: jest.fn(),
			toggleMusic: jest.fn()
		} as jest.Mocked<Music>;

		mockSettings = new Settings(mockStorage) as jest.Mocked<Settings>;
		mockSettings.load = jest.fn();
		mockSettings.save = jest.fn();
		mockSettings.sounds = true;
		mockSettings.music = false;
		mockSettings.lang = 'en';

		// Configure TestBed
		TestBed.configureTestingModule({
			providers: [
				AppService,
				{ provide: TranslateService, useValue: translateService },
				{ provide: LocalstorageService, useValue: mockStorage }
			],
			imports: [TranslateModule.forRoot()]
		});

		// Mock constructors
		(Game as jest.Mock).mockImplementation(() => mockGame);
		(Settings as jest.Mock).mockImplementation(() => mockSettings);

		// Get the service
		service = TestBed.inject(AppService);

		// Replace the service's dependencies with our mocks
		service.game = mockGame;
		service.settings = mockSettings;
		service.translate = translateService;
		service.storage = mockStorage;
	});

	afterEach(() => {
		// Restore navigator
		Object.defineProperty(window, 'navigator', {
			value: originalNavigator,
			writable: true
		});

		jest.clearAllMocks();
	});

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should initialize with correct properties', () => {
			expect(service.name).toBe('Mah Jong');
			expect(service.game).toBe(mockGame);
			expect(service.settings).toBe(mockSettings);
		});

		it('should initialize game and settings', () => {
			const newService = TestBed.inject(AppService);

			expect(newService).toBeTruthy();

			// Verify settings were loaded
			expect(mockSettings.load).toHaveBeenCalled();

			// Verify game was initialized
			expect(mockGame.init).toHaveBeenCalled();

			// Verify sound and music settings were applied
			expect(mockGame.sound.enabled).toBe(mockSettings.sounds);
			expect(mockGame.music.enabled).toBe(mockSettings.music);
		});

		it('should set up translations', () => {
			// Create a new instance to verify constructor behavior
			const newService = TestBed.inject(AppService);

			expect(newService).toBeTruthy();

			// Verify translations were set up
			expect(translateService.setFallbackLang).toHaveBeenCalledWith(DEFAULT_LANGUAGE);

			// Verify each language was set up
			for (const key of Object.keys(LANGUAGES)) {
				expect(translateService.setTranslation).toHaveBeenCalledWith(key, LANGUAGES[key].data);
			}
		});
	});

	describe('setLang', () => {
		it('should use navigator language when settings.lang is auto', () => {
			// Set up test conditions
			mockSettings.lang = LangAuto;

			// Call the method
			service.setLang();

			// Verify the correct language was used
			expect(translateService.use).toHaveBeenCalledWith('en');
		});

		it('should use settings.lang when it is set', () => {
			// Set up test conditions
			mockSettings.lang = 'de';

			// Call the method
			service.setLang();

			// Verify the correct language was used
			expect(translateService.use).toHaveBeenCalledWith('de');
		});

		it('should use default language when navigator language is not supported', () => {
			// Set up test conditions
			mockSettings.lang = LangAuto;
			Object.defineProperty(window.navigator, 'language', { value: 'xx-XX' });

			// Call the method
			service.setLang();

			// Verify the default language was used
			expect(translateService.use).toHaveBeenCalledWith(DEFAULT_LANGUAGE);
		});
	});

	describe('toggleSound', () => {
		it('should toggle sound setting', () => {
			// Set up initial state
			mockSettings.sounds = true;
			mockGame.sound.enabled = true;

			// Call the method
			service.toggleSound();

			// Verify sound was toggled
			expect(mockSettings.sounds).toBe(false);
			expect(mockGame.sound.enabled).toBe(false);
			expect(mockSettings.save).toHaveBeenCalled();
		});

		it('should toggle sound from off to on', () => {
			// Set up initial state
			mockSettings.sounds = false;
			mockGame.sound.enabled = false;

			// Call the method
			service.toggleSound();

			// Verify sound was toggled
			expect(mockSettings.sounds).toBe(true);
			expect(mockGame.sound.enabled).toBe(true);
			expect(mockSettings.save).toHaveBeenCalled();
		});
	});

	describe('toggleMusic', () => {
		it('should toggle music setting', () => {
			// Set up initial state
			mockSettings.music = true;
			mockGame.music.enabled = true;

			// Call the method
			service.toggleMusic();

			// Verify music was toggled
			expect(mockSettings.music).toBe(false);
			expect(mockGame.music.enabled).toBe(false);
			expect(mockGame.music.toggle).toHaveBeenCalled();
			expect(mockSettings.save).toHaveBeenCalled();
		});

		it('should toggle music from off to on', () => {
			// Set up initial state
			mockSettings.music = false;
			mockGame.music.enabled = false;

			// Call the method
			service.toggleMusic();

			// Verify music was toggled
			expect(mockSettings.music).toBe(true);
			expect(mockGame.music.enabled).toBe(true);
			expect(mockGame.music.toggle).toHaveBeenCalled();
			expect(mockSettings.save).toHaveBeenCalled();
		});
	});
});
