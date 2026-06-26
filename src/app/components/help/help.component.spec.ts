import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { HelpComponent } from './help.component';
import { By } from '@angular/platform-browser';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import type { LayoutScoreStore } from '../../model/types';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('HelpComponent', () => {
	let component: HelpComponent;
	let fixture: ComponentFixture<HelpComponent>;
	let translateService: TranslateService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [HelpComponent],
			providers: [provideTranslateService(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(HelpComponent);
		component = fixture.componentInstance;
		translateService = TestBed.inject(TranslateService);
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	it('should initialize with shortcuts array', () => {
		expect(component.shortcuts).toBeDefined();
		expect(component.shortcuts).toHaveLength(8);
		expect(component.shortcuts[0].key).toBe('T');
		expect(component.shortcuts[0].name).toBe('HINT');
	});

	it('should render the how to play section', () => {
		const howToPlaySection = fixture.debugElement.query(By.css('.help'));
		expect(howToPlaySection).toBeTruthy();

		const heading = howToPlaySection.query(By.css('legend'));
		expect(heading).toBeTruthy();
	});

	it('should render the license section', () => {
		const licenseSection = fixture.debugElement.query(By.css('.license'));
		expect(licenseSection).toBeTruthy();

		const heading = licenseSection.query(By.css('legend'));
		expect(heading).toBeTruthy();

		const licenseList = licenseSection.query(By.css('.license-list'));
		expect(licenseList).toBeTruthy();

		const licenseItems = licenseList.queryAll(By.css('.license-list > div'));
		expect(licenseItems).toHaveLength(6);
	});

	it('should render the shortcuts section', () => {
		const shortcutsSection = fixture.debugElement.query(By.css('.keyboard'));
		expect(shortcutsSection).toBeTruthy();

		const heading = shortcutsSection.query(By.css('legend'));
		expect(heading).toBeTruthy();

		const shortcutsList = shortcutsSection.query(By.css('.keyboard-list'));
		expect(shortcutsList).toBeTruthy();
	});

	it('should render all shortcuts from the shortcuts array', () => {
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));
		expect(shortcutItems).toHaveLength(component.shortcuts.length);

		// Check the first shortcut
		const firstShortcut = shortcutItems[0];
		const keyElement = firstShortcut.query(By.css('.key'));
		expect(keyElement.nativeElement.textContent).toBe('T');

		const iconElement = firstShortcut.query(By.css('app-icon-hint'));
		expect(iconElement).toBeTruthy();

		const nameElement = firstShortcut.query(By.css('.name'));
		expect(nameElement).toBeTruthy();
	});

	it('should render shortcuts with icons correctly', () => {
		// Get all shortcut elements
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));

		// Filter shortcuts that have icons
		const shortcutsWithIcons = component.shortcuts
			.map((shortcut, index) => ({ shortcut, index }))
			.filter(item => item.shortcut.icon);

		// Check that shortcuts with icons have the correct icon elements
		for (const { shortcut, index } of shortcutsWithIcons) {
			const shortcutElement = shortcutItems[index];
			const keyElement = shortcutElement.query(By.css('.key'));
			expect(keyElement.nativeElement.textContent).toBe(shortcut.key);

			const iconID = shortcut.icon.name.replace('Icon', '').replace('Component', '').toLowerCase();
			const iconName = `app-icon-${iconID}`;
			const iconElement = shortcutElement.query(By.css(iconName));
			if (!iconElement) {
				console.log(`Checking shortcut "${shortcut.name}" for icon "${iconName}"`);
			}
			expect(iconElement).toBeTruthy();
		}
	});

	it('should render shortcuts with emoji correctly', () => {
		// Get all shortcut elements
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));

		// Filter shortcuts that don't have icons (use emoji instead)
		const shortcutsWithEmoji = component.shortcuts
			.map((shortcut, index) => ({ shortcut, index }))
			.filter(item => !item.shortcut.icon);

		// Check that shortcuts without icons have the correct emoji elements
		for (const { shortcut, index } of shortcutsWithEmoji) {
			const shortcutElement = shortcutItems[index];
			const keyElement = shortcutElement.query(By.css('.key'));
			expect(keyElement.nativeElement.textContent).toBe(shortcut.key);
		}
	});

	it('should use translation service for text content', () => {
		// Set up the translation service with some test translations
		const translations = {
			HOW_TO_PLAY: 'How to Play',
			LICENSE: 'License',
			SHORTCUTS: 'Keyboard Shortcuts',
			HINT: 'Hint',
			HINT_LONG: 'Show a hint'
		};
		translateService.setTranslation('en', translations);
		translateService.use('en');

		// Force change detection to apply translations
		fixture.detectChanges();

		// Check that translations are applied to headings
		const howToPlayHeading = fixture.debugElement.query(By.css('.help legend')).nativeElement;
		const licenseHeading = fixture.debugElement.query(By.css('.license legend')).nativeElement;
		const shortcutsHeading = fixture.debugElement.query(By.css('.keyboard legend')).nativeElement;

		expect(howToPlayHeading.textContent).toBe('How to Play');
		expect(licenseHeading.textContent).toBe('License');
		expect(shortcutsHeading.textContent).toBe('Keyboard Shortcuts');

		// Check that translations are applied to shortcuts
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));
		const firstShortcut = shortcutItems[0]; // This should be the HINT shortcut
		const nameElement = firstShortcut.query(By.css('.name')).nativeElement;
		const functionElement = firstShortcut.query(By.css('.func')).nativeElement;

		expect(nameElement.textContent).toBe('Hint');
		expect(functionElement.textContent).toBe('Show a hint');
	});

	describe('Clear times functionality', () => {
		beforeEach(() => {
			const layoutService = TestBed.inject(LayoutService);
			const localstorageService = TestBed.inject(LocalstorageService);

			layoutService.layouts = {
				items: [{
					id: 'test-layout',
					name: 'Test Layout',
					category: 'Test Category',
					mapping: []
				}]
			};
			const mockResult: LayoutScoreStore = { winCount: 1, loseCount: 1, bestTime: 100, playTime: 200 };
			vi.spyOn(localstorageService, 'getScore').mockReturnValue(mockResult);

			component.ngOnInit();
			fixture.detectChanges();
		});

		it('should render clear best times button if best times exist', () => {
			const clearButton = fixture.debugElement.query(By.css('button.clear-times'));
			expect(clearButton).toBeTruthy();
		});

		it('should call clearTimesClick when clear times button is clicked', () => {
			const clearTimesClickSpy = vi.spyOn(component, 'clearTimesClick');
			const clearButton = fixture.debugElement.query(By.css('button.clear-times')).nativeElement;
			vi.spyOn(window, 'confirm').mockReturnValue(true);

			const originalConsoleError = console.error;
			console.error = vi.fn();
			clearButton.click();
			console.error = originalConsoleError;

			expect(clearTimesClickSpy).toHaveBeenCalled();
		});

		it('should call clearTimes when confirmed', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const clearTimesSpy = vi.spyOn(component, 'clearTimes')
				.mockImplementation(async () => Promise.resolve());

			component.clearTimesClick();

			expect(clearTimesSpy).toHaveBeenCalled();
		});

		it('should not call clearTimes when not confirmed', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(false);
			const clearTimesSpy = vi.spyOn(component, 'clearTimes');

			component.clearTimesClick();

			expect(clearTimesSpy).not.toHaveBeenCalled();
		});

		// OnPush: the async stats reset must still re-render the view
		it('should reset the stats view after clearing times', async () => {
			expect(component.stats().items.length).toBeGreaterThan(0);
			expect(fixture.debugElement.query(By.css('.stats-list table'))).toBeTruthy();

			vi.spyOn(window, 'confirm').mockReturnValue(true);
			vi.spyOn(component, 'clearTimes').mockResolvedValue();

			component.clearTimesClick();
			await fixture.whenStable();
			fixture.detectChanges();

			expect(component.stats().items).toHaveLength(0);
			expect(fixture.debugElement.query(By.css('.stats-empty'))).toBeTruthy();
			expect(fixture.debugElement.query(By.css('.stats-list table'))).toBeFalsy();
		});
	});
});
