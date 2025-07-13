import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { HelpComponent } from './help.component';
import { By } from '@angular/platform-browser';

describe('HelpComponent', () => {
	let component: HelpComponent;
	let fixture: ComponentFixture<HelpComponent>;
	let translateService: TranslateService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [HelpComponent, TranslateModule.forRoot()],
			providers: [AppService]
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
		expect(component.shortcuts[0].icon).toBe('icon-lightbulb');
	});

	it('should render the how to play section', () => {
		const howToPlaySection = fixture.debugElement.query(By.css('.help'));
		expect(howToPlaySection).toBeTruthy();

		const heading = howToPlaySection.query(By.css('h2'));
		expect(heading).toBeTruthy();
	});

	it('should render the license section', () => {
		const licenseSection = fixture.debugElement.query(By.css('.license'));
		expect(licenseSection).toBeTruthy();

		const heading = licenseSection.query(By.css('h2'));
		expect(heading).toBeTruthy();

		const licenseList = licenseSection.query(By.css('.license-list'));
		expect(licenseList).toBeTruthy();

		const licenseItems = licenseList.queryAll(By.css('.license-list > div'));
		expect(licenseItems).toHaveLength(5);
	});

	it('should render the shortcuts section', () => {
		const shortcutsSection = fixture.debugElement.query(By.css('.keyboard'));
		expect(shortcutsSection).toBeTruthy();

		const heading = shortcutsSection.query(By.css('h2'));
		expect(heading).toBeTruthy();

		const shortcutsList = shortcutsSection.query(By.css('.keyboard-list'));
		expect(shortcutsList).toBeTruthy();
	});

	it('should render all shortcuts from the shortcuts array', () => {
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));
		expect(shortcutItems).toHaveLength(component.shortcuts.length);

		// Check first shortcut
		const firstShortcut = shortcutItems[0];
		const keyElement = firstShortcut.query(By.css('.key'));
		expect(keyElement.nativeElement.textContent).toBe('T');

		const iconElement = firstShortcut.query(By.css('i'));
		expect(iconElement.nativeElement.className).toContain('icon-lightbulb');

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
		shortcutsWithIcons.forEach(({ shortcut, index }) => {
			const shortcutElement = shortcutItems[index];
			const keyElement = shortcutElement.query(By.css('.key'));
			expect(keyElement.nativeElement.textContent).toBe(shortcut.key);

			const iconElement = shortcutElement.query(By.css('i'));
			expect(iconElement).toBeTruthy();
			expect(iconElement.nativeElement.className).toContain(shortcut.icon);
		});
	});

	it('should render shortcuts with emoji correctly', () => {
		// Get all shortcut elements
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));

		// Filter shortcuts that don't have icons (use emoji instead)
		const shortcutsWithEmoji = component.shortcuts
			.map((shortcut, index) => ({ shortcut, index }))
			.filter(item => !item.shortcut.icon);

		// Check that shortcuts without icons have the correct emoji elements
		shortcutsWithEmoji.forEach(({ shortcut, index }) => {
			const shortcutElement = shortcutItems[index];
			const keyElement = shortcutElement.query(By.css('.key'));
			expect(keyElement.nativeElement.textContent).toBe(shortcut.key);

			const emojiElement = shortcutElement.query(By.css('.icon'));
			expect(emojiElement).toBeTruthy();
			expect(emojiElement.nativeElement.textContent).toBe('🀄️');
		});
	});

	it('should render the last shortcut (Help) with emoji instead of icon', () => {
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));
		const lastShortcut = shortcutItems[shortcutItems.length - 1];

		// Verify it's the Help shortcut
		const keyElement = lastShortcut.query(By.css('.key'));
		expect(keyElement.nativeElement.textContent).toBe('H');

		// Verify it has an emoji instead of an icon
		const iconElement = lastShortcut.query(By.css('i'));
		expect(iconElement).toBeFalsy(); // Should not have an icon element

		const emojiElement = lastShortcut.query(By.css('.icon'));
		expect(emojiElement).toBeTruthy();
		expect(emojiElement.nativeElement.textContent).toBe('🀄️');
	});

	it('should use translation service for text content', () => {
		// Set up the translation service with some test translations
		const translations = {
			'HOW_TO_PLAY': 'How to Play',
			'LICENSE': 'License',
			'SHORTCUTS': 'Keyboard Shortcuts',
			'HINT': 'Hint',
			'HINT_LONG': 'Show a hint'
		};
		translateService.setTranslation('en', translations);
		translateService.use('en');

		// Force change detection to apply translations
		fixture.detectChanges();

		// Check that translations are applied to headings
		const howToPlayHeading = fixture.debugElement.query(By.css('.help h2')).nativeElement;
		const licenseHeading = fixture.debugElement.query(By.css('.license h2')).nativeElement;
		const shortcutsHeading = fixture.debugElement.query(By.css('.keyboard h2')).nativeElement;

		expect(howToPlayHeading.textContent).toBe('How to Play');
		expect(licenseHeading.textContent).toBe('License');
		expect(shortcutsHeading.textContent).toBe('Keyboard Shortcuts');

		// Check that translations are applied to shortcuts
		const shortcutItems = fixture.debugElement.queryAll(By.css('.keyboard-list li'));
		const firstShortcut = shortcutItems[0]; // This should be the HINT shortcut
		const nameElement = firstShortcut.query(By.css('.name')).nativeElement;
		const funcElement = firstShortcut.query(By.css('.func')).nativeElement;

		expect(nameElement.textContent).toBe('Hint');
		expect(funcElement.textContent).toBe('Show a hint');
	});
});
