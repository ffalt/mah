import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { SvgdefService } from '../../service/svgdef.service';
import { TileComponent } from '../tile/tile.component';
import { CoreModule } from '../../modules/core/core.module';
import { AppService } from '../../service/app.service';
import { TilesInfoComponent } from './tiles-info.component';
import { By } from '@angular/platform-browser';
import { ImageSets, TILES_INFOS } from '../../model/consts';

describe('TilesInfoComponent', () => {
	let component: TilesInfoComponent;
	let fixture: ComponentFixture<TilesInfoComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [
				TilesInfoComponent,
				TileComponent
			],
			providers: [provideHttpClient(), SvgdefService, AppService],
			imports: [CoreModule, TranslateModule.forRoot()]
		})
			.compileComponents());

	beforeEach(() => {
		appService = TestBed.inject(AppService);
		fixture = TestBed.createComponent(TilesInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	describe('Component properties', () => {
		it('should initialize TILES_INFOS property', () => {
			expect(component.TILES_INFOS).toEqual(TILES_INFOS);
		});

		it('should initialize sets property', () => {
			expect(component.sets).toEqual(ImageSets);
		});

		it('should initialize tileset from AppService settings', () => {
			expect(component.tileset).toEqual(appService.settings.tileset);
		});

		it('should initialize isDark from AppService settings', () => {
			expect(component.isDark).toEqual(appService.settings.dark);
		});

		it('should initialize kyodaiUrl from AppService settings', () => {
			expect(component.kyodaiUrl).toEqual(appService.settings.kyodaiUrl);
		});
	});

	describe('Component rendering', () => {
		it('should render tile sections for each group in TILES_INFOS', () => {
			const tileSections = fixture.debugElement.queryAll(By.css('.tiles-section'));

			// Count the total number of groups across all suits in TILES_INFOS
			const totalGroups = TILES_INFOS.reduce((count, suit) => count + suit.groups.length, 0);

			expect(tileSections).toHaveLength(totalGroups);
		});

		it('should render tile titles for each group', () => {
			const tileTitles = fixture.debugElement.queryAll(By.css('.tiles-title'));

			// Count the total number of groups across all suits in TILES_INFOS
			const totalGroups = TILES_INFOS.reduce((count, suit) => count + suit.groups.length, 0);

			expect(tileTitles).toHaveLength(totalGroups);
		});

		it('should render app-tile components for each tile', () => {
			const tileComponents = fixture.debugElement.queryAll(By.css('app-tile'));

			// Count the total number of tiles across all groups in TILES_INFOS
			const totalTiles = TILES_INFOS.reduce((suitCount, suit) =>
				suitCount + suit.groups.reduce((groupCount, group) =>
					groupCount + group.tiles.length, 0), 0);

			expect(tileComponents).toHaveLength(totalTiles);
		});

		it('should render select element with options for each image set', () => {
			const selectElement = fixture.debugElement.query(By.css('select'));
			expect(selectElement).toBeTruthy();

			const options = fixture.debugElement.queryAll(By.css('select option'));
			expect(options).toHaveLength(ImageSets.length);
		});

		it('should render checkbox for dark mode', () => {
			const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]'));
			expect(checkbox).toBeTruthy();
			expect(checkbox.properties['checked']).toBe(component.isDark);
		});

		it('should render Wikipedia reference link', () => {
			const link = fixture.debugElement.query(By.css('.tiles-reference a'));
			expect(link).toBeTruthy();
		});
	});

	describe('Component interactions', () => {
		it('should update tileset when select value changes', () => {
			const selectElement = fixture.debugElement.query(By.css('select')).nativeElement;
			const newTileset = 'classic';

			// Simulate select change
			selectElement.value = newTileset;
			selectElement.dispatchEvent(new Event('change'));
			fixture.detectChanges();

			expect(component.tileset).toBe(newTileset);
		});

		it('should toggle isDark when checkbox is clicked', () => {
			const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]')).nativeElement;
			const initialValue = component.isDark;

			// Simulate checkbox click
			checkbox.click();
			fixture.detectChanges();

			expect(component.isDark).toBe(!initialValue);
		});
	});
});
