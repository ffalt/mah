import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SvgdefService } from '../../service/svgdef.service';
import { TilePreviewComponent } from './tile-preview.component';
import { By } from '@angular/platform-browser';

describe('TilePreviewComponent', () => {
	let component: TilePreviewComponent;
	let fixture: ComponentFixture<TilePreviewComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [TilePreviewComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TilePreviewComponent);
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() => {
			fixture.detectChanges();
		});
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have default tile t_dr_red', () => {
		expect(component.tile()).toBe('t_dr_red');
	});

	it('should accept custom tile input', () => {
		fixture.componentRef.setInput('tile', 't_ba1');
		fixture.detectChanges();
		expect(component.tile()).toBe('t_ba1');
	});

	it('should render an SVG element', () => {
		const svg = fixture.debugElement.query(By.css('svg'));
		expect(svg).toBeTruthy();
	});

	it('should render the preview-stage group', () => {
		const stage = fixture.debugElement.query(By.css('g.preview-stage'));
		expect(stage).toBeTruthy();
	});

	it('should render a draw group with a tile group', () => {
		const tile = fixture.debugElement.query(By.css('g.draw g.tile'));
		expect(tile).toBeTruthy();
	});

	it('should render stone rect', () => {
		const stone = fixture.debugElement.query(By.css('rect.stone'));
		expect(stone).toBeTruthy();
	});

	it('should render shadow rect', () => {
		const shadow = fixture.debugElement.query(By.css('rect.shadow'));
		expect(shadow).toBeTruthy();
	});

	it('should apply dark class when settings.dark is true', () => {
		component.app.settings.dark = true;
		fixture.detectChanges();
		const stage = fixture.debugElement.query(By.css('g.preview-stage'));
		expect(stage.nativeElement.classList.contains('dark')).toBe(true);
	});

	it('should apply contrast class when settings.contrast is true', () => {
		component.app.settings.contrast = true;
		fixture.detectChanges();
		const stage = fixture.debugElement.query(By.css('g.preview-stage'));
		expect(stage.nativeElement.classList.contains('contrast')).toBe(true);
	});

	it('should apply tile3d class when settings.tile3d is true', () => {
		component.app.settings.tile3d = true;
		fixture.detectChanges();
		const stage = fixture.debugElement.query(By.css('g.preview-stage'));
		expect(stage.nativeElement.classList.contains('tile3d')).toBe(true);
	});

	it('should render bevel rect when tile3d is true', () => {
		component.app.settings.tile3d = true;
		fixture.detectChanges();
		const bevel = fixture.debugElement.query(By.css('rect.bevel'));
		expect(bevel).toBeTruthy();
	});

	it('should not render bevel rect when tile3d is false', () => {
		component.app.settings.tile3d = false;
		fixture.detectChanges();
		const bevel = fixture.debugElement.query(By.css('rect.bevel'));
		expect(bevel).toBeFalsy();
	});
});
