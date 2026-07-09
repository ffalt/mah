import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppService } from './app.service';
import { TranslateService } from '@ngx-translate/core';
import { Game } from '../model/game';
import { Settings } from '../model/settings';
import { LocalstorageService } from './localstorage.service';
import { DEFAULT_LANGUAGE } from '../model/languages';
import { LangAuto } from '../model/consts';
import type { Sound } from '../model/sound';
import { Mock, describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('AppService', () => {
	let service: AppService;
	let translateService: { use: Mock; setTranslation: Mock; setFallbackLang: Mock };
	let mockGame: {
		init: Mock;
		destroy: Mock;
		sound: { enabled: boolean };
		music: { enabled: boolean; toggle: Mock; play: Mock; pause: Mock; toggleMusic: Mock };
	};
	let mockSettings: { load: Mock; save: Mock; sounds: WritableSignal<boolean>; music: WritableSignal<boolean>; lang: WritableSignal<string> };
	let mockStorage: Partial<LocalstorageService>;
	let originalNavigator: Navigator;

	beforeEach(async () => {
		originalNavigator = window.navigator;
		Object.defineProperty(window, 'navigator', {
			value: { language: 'en-US' },
			writable: true
		});

		translateService = {
			use: vi.fn(),
			setTranslation: vi.fn(),
			setFallbackLang: vi.fn()
		};

		mockStorage = {};

		mockGame = {
			init: vi.fn(),
			destroy: vi.fn(),
			sound: { enabled: false } as unknown as Sound,
			music: {
				enabled: false,
				toggle: vi.fn(),
				play: vi.fn(),
				pause: vi.fn(),
				toggleMusic: vi.fn()
			}
		};

		mockSettings = {
			load: vi.fn(),
			save: vi.fn(),
			sounds: signal(true),
			music: signal(false),
			lang: signal('en')
		};

		TestBed.configureTestingModule({
			providers: [
				AppService,
				{ provide: TranslateService, useValue: translateService },
				{ provide: LocalstorageService, useValue: mockStorage }
			]
		});

		service = TestBed.inject(AppService);

		service.game = mockGame as unknown as Game;
		service.settings = mockSettings as unknown as Settings;
		service.translate = translateService as unknown as TranslateService;
		service.storage = mockStorage as LocalstorageService;
	});

	afterEach(async () => {
		Object.defineProperty(window, 'navigator', {
			value: originalNavigator,
			writable: true
		});
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
			expect(service.game).toBeDefined();
			expect(service.settings).toBeDefined();
		});
	});

	describe('setLang', () => {
		it('should use navigator language when settings.lang is auto', () => {
			mockSettings.lang.set(LangAuto);
			service.setLang();
			expect(translateService.use).toHaveBeenCalledWith('en');
		});

		it('should use settings.lang when it is set', () => {
			mockSettings.lang.set('de');
			service.setLang();
			expect(translateService.use).toHaveBeenCalledWith('de');
		});

		it('should use default language when navigator language is not supported', () => {
			mockSettings.lang.set(LangAuto);
			Object.defineProperty(window.navigator, 'language', { value: 'xx-XX' });
			service.setLang();
			expect(translateService.use).toHaveBeenCalledWith(DEFAULT_LANGUAGE);
		});
	});

	describe('toggleSound', () => {
		it('should toggle sound setting', () => {
			mockSettings.sounds.set(true);
			mockGame.sound.enabled = true;
			service.toggleSound();
			expect(mockSettings.sounds()).toBe(false);
			expect(mockGame.sound.enabled).toBe(false);
			expect(mockSettings.save).toHaveBeenCalled();
		});

		it('should toggle sound from off to on', () => {
			mockSettings.sounds.set(false);
			mockGame.sound.enabled = false;
			service.toggleSound();
			expect(mockSettings.sounds()).toBe(true);
			expect(mockGame.sound.enabled).toBe(true);
			expect(mockSettings.save).toHaveBeenCalled();
		});
	});

	describe('toggleMusic', () => {
		it('should toggle music setting', () => {
			mockSettings.music.set(true);
			mockGame.music.enabled = true;
			service.toggleMusic();
			expect(mockSettings.music()).toBe(false);
			expect(mockGame.music.enabled).toBe(false);
			expect(mockGame.music.toggle).toHaveBeenCalled();
			expect(mockSettings.save).toHaveBeenCalled();
		});

		it('should toggle music from off to on', () => {
			mockSettings.music.set(false);
			mockGame.music.enabled = false;
			service.toggleMusic();
			expect(mockSettings.music()).toBe(true);
			expect(mockGame.music.enabled).toBe(true);
			expect(mockGame.music.toggle).toHaveBeenCalled();
			expect(mockSettings.save).toHaveBeenCalled();
		});
	});
});
