import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../service/layout.service';
import { CoreModule } from '../../modules/core/core.module';
import { GAME_MODE_EASY, GAME_MODE_STANDARD } from '../../model/consts';
import { ChooseLayoutComponent } from './choose-layout.component';
import { MODE_SOLVABLE, MODE_RANDOM } from '../../model/builder';
import { LocalstorageService } from '../../service/localstorage.service';
import { By } from '@angular/platform-browser';
import type { Layout } from '../../model/types';

describe('ChooseLayoutComponent', () => {
	let component: ChooseLayoutComponent;
	let fixture: ComponentFixture<ChooseLayoutComponent>;
	let layoutService: LayoutService;
	let storageService: LocalstorageService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ChooseLayoutComponent],
			imports: [CoreModule, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService, LocalstorageService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ChooseLayoutComponent);
		fixture.componentRef.setInput('gameMode', GAME_MODE_EASY);
		component = fixture.componentInstance;
		layoutService = TestBed.inject(LayoutService);
		storageService = TestBed.inject(LocalstorageService);

		// Mock layouts for testing
		layoutService.layouts = {
			items: [
				{
					id: 'layout1',
					name: 'Test Layout 1',
					category: 'Test',
					mapping: []
				},
				{
					id: 'layout2',
					name: 'Test Layout 2',
					category: 'Test',
					mapping: []
				}
			]
		};

		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	it('should initialize with default values', () => {
		expect(component.gameMode()).toBe(GAME_MODE_EASY);
		expect(component.buildMode).toBe(MODE_SOLVABLE);
		expect(component.buildModes).toHaveLength(2);
		expect(component.gameModes).toHaveLength(3);
	});

	it('should emit startEvent with correct data when onStart is called', () => {
		// Arrange
		const layout: Layout = {
			id: 'test-layout',
			name: 'Test Layout',
			category: 'Test',
			mapping: []
		};
		const spy = jest.spyOn(component.startEvent, 'emit');
		const storageSpy = jest.spyOn(storageService, 'storeLastPlayed');

		// Act
		component.onStart(layout);

		// Assert
		expect(spy).toHaveBeenCalledWith({
			layout,
			buildMode: MODE_SOLVABLE,
			gameMode: GAME_MODE_EASY
		});
		expect(storageSpy).toHaveBeenCalledWith('test-layout');
	});

	it('should select a random layout and call onStart when randomGame is called', () => {
		// Arrange
		const spy = jest.spyOn(component, 'onStart');
		const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.25);

		// Act
		component.randomGame();

		// Assert
		expect(spy).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledWith(layoutService.layouts.items[0]);

		// Cleanup
		mathRandomSpy.mockRestore();
	});

	it('should update buildMode when select is changed', () => {
		// Arrange
		const select = fixture.debugElement.query(By.css('#board-generator-select')).nativeElement;

		// Act
		select.value = MODE_RANDOM;
		select.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		// Assert
		expect(component.buildMode).toBe(MODE_RANDOM);
	});

	it('should update gameMode when select is changed', () => {
		// Arrange
		const select = fixture.debugElement.query(By.css('#game-mode-select')).nativeElement;
		const gameModeSpy = jest.spyOn(component.gameMode, 'set');

		// Act
		select.value = GAME_MODE_STANDARD;
		select.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		// Assert
		expect(gameModeSpy).toHaveBeenCalledWith(GAME_MODE_STANDARD);
	});

	it('should render the random game button', () => {
		// Arrange
		const button = fixture.debugElement.query(By.css('.start-links button'));

		// Assert
		expect(button).toBeTruthy();
		expect(button.nativeElement.textContent).toContain('START_RANDOM');
	});

	it('should call randomGame when random game button is clicked', () => {
		// Arrange
		const button = fixture.debugElement.query(By.css('.start-links button')).nativeElement;
		const spy = jest.spyOn(component, 'randomGame');

		// Act
		button.click();
		fixture.detectChanges();

		// Assert
		expect(spy).toHaveBeenCalled();
	});
});
