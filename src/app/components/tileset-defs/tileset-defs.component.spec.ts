import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SvgdefService } from '../../service/svgdef.service';
import { TilesetDefsComponent } from './tileset-defs.component';
import { By } from '@angular/platform-browser';

describe('TilesetDefsComponent', () => {
	let component: TilesetDefsComponent;
	let fixture: ComponentFixture<TilesetDefsComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [TilesetDefsComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TilesetDefsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have default prefix of shared_', () => {
		expect(component.prefix()).toBe('shared_');
	});

	it('should have default isDark of false', () => {
		expect(component.isDark()).toBe(false);
	});

	it('should accept imageSet input', () => {
		fixture.componentRef.setInput('imageSet', 'default');
		fixture.detectChanges();
		expect(component.imageSet()).toBe('default');
	});

	it('should accept kyodaiUrl input', () => {
		fixture.componentRef.setInput('kyodaiUrl', 'https://example.com');
		fixture.detectChanges();
		expect(component.kyodaiUrl()).toBe('https://example.com');
	});

	it('should accept isDark input', () => {
		fixture.componentRef.setInput('isDark', true);
		fixture.detectChanges();
		expect(component.isDark()).toBe(true);
	});

	it('should accept prefix input', () => {
		fixture.componentRef.setInput('prefix', 'custom_');
		fixture.detectChanges();
		expect(component.prefix()).toBe('custom_');
	});

	it('should render an SVG element', () => {
		const svgElement = fixture.debugElement.query(By.css('svg'));
		expect(svgElement).toBeTruthy();
	});

	it('should render image-set-loader inside defs', () => {
		fixture.componentRef.setInput('imageSet', 'default');
		fixture.detectChanges();
		const defsElement = fixture.debugElement.query(By.css('svg defs'));
		expect(defsElement).toBeTruthy();
	});
});
