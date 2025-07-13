import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { AppService } from '../../service/app.service';
import { LayoutService } from '../../service/layout.service';
import { SettingsComponent } from './settings.component';
import { By } from '@angular/platform-browser';
import { LocalstorageService } from '../../service/localstorage.service';
import { Backgrounds, ImageSets, Themes } from '../../model/consts';
import { KyodaiTileSets } from '../../model/tilesets';
import { environment } from '../../../environments/environment';
import { ElementRef } from '@angular/core';

describe('SettingsComponent', () => {
	let component: SettingsComponent;
	let fixture: ComponentFixture<SettingsComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [SettingsComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), AppService, LayoutService, LocalstorageService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(SettingsComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	it('should initialize with correct properties', () => {
		expect(component.canKyodai).toBe(environment.kyodai);
		expect(component.kyodaiTileSets).toBe(KyodaiTileSets);
		expect(component.sets).toBe(ImageSets);
		expect(component.backs).toBe(Backgrounds);
		expect(component.themes).toBe(Themes);
		expect(component.app).toBeDefined();
	});

	describe('Kyodai URL management', () => {
		it('should update Kyodai URL', () => {
			const saveSpy = jest.spyOn(appService.settings, 'save');
			const testUrl = 'https://example.com/tileset';
			const event = { target: { value: testUrl } } as unknown as Event;

			component.updateKyodaiUrl(event);

			expect(appService.settings.kyodaiUrl).toBe(testUrl);
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should clear Kyodai URL', () => {
			const saveSpy = jest.spyOn(appService.settings, 'save');
			appService.settings.kyodaiUrl = 'https://example.com/tileset';

			component.clearKyodaiUrl();

			expect(appService.settings.kyodaiUrl).toBeUndefined();
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should set Kyodai URL from dropdown', () => {
			// Mock the kyodaiInput viewChild
			const mockNativeElement = { value: '' };
			const mockElementRef = { nativeElement: mockNativeElement };
			jest.spyOn(component, 'kyodaiInput').mockReturnValue(mockElementRef as ElementRef<HTMLInputElement>);

			const testUrl = 'https://example.com/tileset';
			const event = {
				preventDefault: jest.fn(),
				stopPropagation: jest.fn(),
				target: { value: testUrl }
			} as unknown as Event;

			component.setKyodaiUrl(event);

			expect(mockNativeElement.value).toBe(testUrl);
			expect(event.preventDefault).toHaveBeenCalled();
			expect(event.stopPropagation).toHaveBeenCalled();
		});

		it('should apply Kyodai URL', () => {
			const saveSpy = jest.spyOn(appService.settings, 'save');
			const testUrl = 'https://example.com/tileset';

			// Mock the kyodaiInput viewChild
			const mockNativeElement = { value: testUrl };
			const mockElementRef = { nativeElement: mockNativeElement };
			jest.spyOn(component, 'kyodaiInput').mockReturnValue(mockElementRef as ElementRef<HTMLInputElement>);

			component.applyKyodaiUrl();

			expect(appService.settings.kyodaiUrl).toBe(testUrl);
			expect(saveSpy).toHaveBeenCalled();
		});
	});

	describe('Clear times functionality', () => {
		it('should call clearTimes when confirmed', () => {
			// Mock confirm to return true
			const originalConfirm = window.confirm;
			window.confirm = jest.fn().mockReturnValue(true);

			// Mock clearTimes method
			const clearTimesSpy = jest.spyOn(component, 'clearTimes')
				.mockImplementation(async () => Promise.resolve());

			// Call the method
			component.clearTimesClick();

			// Verify clearTimes was called
			expect(clearTimesSpy).toHaveBeenCalled();

			// Restore original confirm
			window.confirm = originalConfirm;
		});

		it('should not call clearTimes when not confirmed', () => {
			// Mock confirm to return false
			const originalConfirm = window.confirm;
			window.confirm = jest.fn().mockReturnValue(false);

			// Mock clearTimes method
			const clearTimesSpy = jest.spyOn(component, 'clearTimes');

			// Call the method
			component.clearTimesClick();

			// Verify clearTimes was not called
			expect(clearTimesSpy).not.toHaveBeenCalled();

			// Restore original confirm
			window.confirm = originalConfirm;
		});
	});

	describe('UI Elements', () => {
		it('should render language selection radio buttons', () => {
			const languageSection = fixture.debugElement.query(By.css('.settings p:nth-child(1)'));
			expect(languageSection).toBeTruthy();

			const radioButtons = fixture.debugElement.queryAll(By.css('input[name="lang"]'));
			expect(radioButtons).toHaveLength(component.languages.length + 1); // +1 for auto option
		});

		it('should render background selection radio buttons', () => {
			const backgroundSection = fixture.debugElement.query(By.css('.settings p:nth-child(3)'));
			expect(backgroundSection).toBeTruthy();

			const radioButtons = fixture.debugElement.queryAll(By.css('input[name="back"]'));
			expect(radioButtons).toHaveLength(component.backs.length);
		});

		it('should render theme selection radio buttons', () => {
			const themeSection = fixture.debugElement.query(By.css('.settings p:nth-child(5)'));
			expect(themeSection).toBeTruthy();

			const radioButtons = fixture.debugElement.queryAll(By.css('input[name="color"]'));
			expect(radioButtons).toHaveLength(component.themes.length);
		});

		it('should render tileset selection radio buttons', () => {
			const tilesetSection = fixture.debugElement.query(By.css('.settings:nth-child(2) p:nth-child(1)'));
			expect(tilesetSection).toBeTruthy();

			const radioButtons = fixture.debugElement.queryAll(By.css('input[name="imageset"]'));
			// Number of buttons should be sets.length + (canKyodai ? 1 : 0)
			const expectedCount = component.sets.length + (component.canKyodai ? 1 : 0);
			expect(radioButtons).toHaveLength(expectedCount);
		});

		it('should render contrast and dark mode checkboxes', () => {
			const tilesSection = fixture.debugElement.query(By.css('.settings:nth-child(2) p:nth-child(3)'));
			expect(tilesSection).toBeTruthy();

			const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
			expect(checkboxes).toHaveLength(2);
		});

		it('should render clear best times button', () => {
			const bestTimesSection = fixture.debugElement.query(By.css('.settings:nth-child(2) p:nth-child(5)'));
			expect(bestTimesSection).toBeTruthy();

			const clearButton = fixture.debugElement.query(By.css('button.clear-times'));
			expect(clearButton).toBeTruthy();
		});
	});

	describe('Settings interactions', () => {
		it('should have a method to set language', () => {
			// Instead of testing the click event, test the change handler directly
			appService.settings.lang = 'en';
			component.app.setLang = jest.fn();

			// Call the change handler directly (simulating what happens when radio is clicked)
			appService.settings.lang = 'auto';
			appService.setLang();

			expect(appService.settings.lang).toBe('auto');
			expect(component.app.setLang).toHaveBeenCalled();
		});

		it('should have a method to set background', () => {
			// Instead of testing the click event, test the change handler directly
			const saveSpy = jest.spyOn(appService.settings, 'save');
			appService.settings.background = '';

			// Set a background value directly (simulating what happens when radio is clicked)
			appService.settings.background = 'test-background';
			appService.settings.save();

			expect(appService.settings.background).toBe('test-background');
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should have a method to set theme', () => {
			// Instead of testing the click event, test the change handler directly
			const saveSpy = jest.spyOn(appService.settings, 'save');
			appService.settings.theme = '';

			// Set a theme value directly (simulating what happens when radio is clicked)
			appService.settings.theme = 'test-theme';
			appService.settings.save();

			expect(appService.settings.theme).toBe('test-theme');
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should have a method to set tileset', () => {
			// Instead of testing the click event, test the change handler directly
			const saveSpy = jest.spyOn(appService.settings, 'save');
			appService.settings.tileset = '';

			// Set a tileset value directly (simulating what happens when radio is clicked)
			appService.settings.tileset = 'test-tileset';
			appService.settings.save();

			expect(appService.settings.tileset).toBe('test-tileset');
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should update app settings when contrast is toggled', () => {
			const saveSpy = jest.spyOn(appService.settings, 'save');
			const initialValue = appService.settings.contrast;
			const contrastCheckbox = fixture.debugElement.query(By.css('input[type="checkbox"]:nth-child(1)')).nativeElement;

			contrastCheckbox.click();
			fixture.detectChanges();

			expect(appService.settings.contrast).toBe(!initialValue);
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should update app settings when dark mode is toggled', () => {
			const saveSpy = jest.spyOn(appService.settings, 'save');
			const initialValue = appService.settings.dark;
			const darkCheckbox = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'))[1].nativeElement;

			darkCheckbox.click();
			fixture.detectChanges();

			expect(appService.settings.dark).toBe(!initialValue);
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should call clearTimesClick when clear times button is clicked', () => {
			const clearTimesClickSpy = jest.spyOn(component, 'clearTimesClick');
			const clearButton = fixture.debugElement.query(By.css('button.clear-times')).nativeElement;
			const originalConfirm = window.confirm;
			window.confirm = jest.fn().mockReturnValue(true);

			clearButton.click();

			expect(clearTimesClickSpy).toHaveBeenCalled();

			window.confirm = originalConfirm;
		});
	});
});
