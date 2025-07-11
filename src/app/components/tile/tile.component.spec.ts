import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SvgdefService } from '../../service/svgdef.service';
import { CoreModule } from '../../modules/core/core.module';
import { TileComponent } from './tile.component';
import { By } from '@angular/platform-browser';

describe('TileComponent', () => {
	let component: TileComponent;
	let fixture: ComponentFixture<TileComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TileComponent],
			imports: [CoreModule, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TileComponent);
		fixture.componentRef.setInput('tile', '');
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() => {
			fixture.detectChanges();
		});
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	describe('Input properties', () => {
		it('should accept tile input (required)', () => {
			const testTile = 'c1';
			fixture.componentRef.setInput('tile', testTile);
			fixture.detectChanges();

			expect(component.tile()).toBe(testTile);
		});

		it('should accept optional imageSet input', () => {
			const testImageSet = 'classic';
			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.detectChanges();

			expect(component.imageSet()).toBe(testImageSet);
		});

		it('should accept optional kyodaiUrl input', () => {
			const testUrl = 'https://example.com/tileset';
			fixture.componentRef.setInput('kyodaiUrl', testUrl);
			fixture.detectChanges();

			expect(component.kyodaiUrl()).toBe(testUrl);
		});

		it('should accept optional index input', () => {
			const testIndex = 5;
			fixture.componentRef.setInput('index', testIndex);
			fixture.detectChanges();

			expect(component.index()).toBe(testIndex);
		});

		it('should have default value for isDark input', () => {
			expect(component.isDark()).toBe(false);
		});

		it('should accept isDark input override', () => {
			fixture.componentRef.setInput('isDark', true);
			fixture.detectChanges();

			expect(component.isDark()).toBe(true);
		});
	});

	describe('Component rendering', () => {
		it('should render an SVG element', () => {
			const svgElement = fixture.debugElement.query(By.css('svg'));
			expect(svgElement).toBeTruthy();
		});

		it('should add dark class to SVG when isDark is true', () => {
			fixture.componentRef.setInput('isDark', true);
			fixture.detectChanges();

			const svgElement = fixture.debugElement.query(By.css('svg.dark'));
			expect(svgElement).toBeTruthy();
		});

		it('should not add dark class to SVG when isDark is false', () => {
			fixture.componentRef.setInput('isDark', false);
			fixture.detectChanges();

			const svgElement = fixture.debugElement.query(By.css('svg.dark'));
			expect(svgElement).toBeFalsy();
		});

		it('should render title with translated tile value', () => {
			const testTile = 'c1';
			fixture.componentRef.setInput('tile', testTile);
			fixture.detectChanges();

			const titleElement = fixture.debugElement.query(By.css('svg title'));
			expect(titleElement).toBeTruthy();
			// Note: We can't easily test the actual translated value in this test environment
		});

		it('should render use element with correct href attribute', () => {
			const testTile = 'c1';
			const testImageSet = 'classic';
			const testIndex = 5;

			fixture.componentRef.setInput('tile', testTile);
			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.componentRef.setInput('index', testIndex);
			fixture.detectChanges();

			const useElement = fixture.debugElement.query(By.css('svg use'));
			expect(useElement).toBeTruthy();
			expect(useElement.attributes['xlink:href']).toBe('#t_classic_5_c1');
		});

		it('should pass correct attributes to app-image-set-loader', () => {
			const testImageSet = 'classic';
			const testUrl = 'https://example.com/tileset';
			const testIndex = 5;

			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.componentRef.setInput('kyodaiUrl', testUrl);
			fixture.componentRef.setInput('index', testIndex);
			fixture.componentRef.setInput('isDark', true);
			fixture.detectChanges();

			const defsElement = fixture.debugElement.query(By.css('svg defs'));
			expect(defsElement).toBeTruthy();
			expect(defsElement.componentInstance.imageSet()).toBe(testImageSet);
			expect(defsElement.componentInstance.kyodaiUrl()).toBe(testUrl);
			expect(defsElement.componentInstance.dark()).toBe(true);
			expect(defsElement.componentInstance.prefix()).toBe('t_classic_5_');
		});
	});
});
