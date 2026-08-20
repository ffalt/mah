import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { Stone } from '../../model/stone';
import { type Draw, calcDrawPos } from '../../model/draw';
import { CONSTS } from '../../model/consts';
import { BoardTileComponent } from './board-tile.component';

function makeDraw(): Draw {
	const stone = new Stone(0, 0, 0, 0, 0);
	stone.img = { id: 'c1' };
	return { z: 0, x: 0, y: 0, v: 0, visible: true, url: 'c1', pos: calcDrawPos(0, 0, 0), source: stone };
}

describe('BoardTileComponent', () => {
	let component: BoardTileComponent;
	let fixture: ComponentFixture<BoardTileComponent>;
	let appService: AppService;
	let draw: Draw;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [BoardTileComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(BoardTileComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		draw = makeDraw();
		fixture.componentRef.setInput('draw', draw);
		fixture.componentRef.setInput('imagePos', [1, 1, 69, 88]);
		fixture.componentRef.setInput('urlPrefix', '#b_test_');
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should apply the stone position as transform', () => {
		expect(fixture.nativeElement.getAttribute('transform')).toBe(draw.pos.translate);
	});

	it('should expose the stable draw key for delegated events', () => {
		draw.key = '0:0:0';
		fixture.componentRef.setInput('draw', { ...draw });
		fixture.detectChanges();
		expect(fixture.nativeElement.dataset.drawKey).toBe('0:0:0');
	});

	it('should be interactive when the stone is neither picked nor blocked', () => {
		expect(component.interactive()).toBe(true);
		expect(fixture.nativeElement.getAttribute('role')).toBe('button');
		expect(fixture.nativeElement.getAttribute('tabindex')).toBe('0');
	});

	it('should not be interactive when the stone is blocked', () => {
		draw.source.state.set({ blocked: true, removable: false });
		fixture.detectChanges();
		expect(component.interactive()).toBe(false);
		expect(fixture.nativeElement.getAttribute('role')).toBeNull();
		expect(fixture.nativeElement.getAttribute('tabindex')).toBeNull();
	});

	it('should reflect stone signals as classes', () => {
		expect(fixture.nativeElement.classList.contains('selected')).toBe(false);
		draw.source.selected.set(true);
		draw.source.hinted.set(true);
		fixture.detectChanges();
		expect(fixture.nativeElement.classList.contains('selected')).toBe(true);
		expect(fixture.nativeElement.classList.contains('hinted')).toBe(true);
	});

	it('should add the hidden class when the stone is picked', () => {
		draw.source.picked.set(true);
		fixture.detectChanges();
		expect(fixture.nativeElement.classList.contains('hidden')).toBe(true);
		expect(fixture.nativeElement.getAttribute('role')).toBeNull();
	});

	describe('Blackout', () => {
		function startBlackout(): void {
			fixture.componentRef.setInput('blackout', true);
		}

		it('should draw a back instead of the face while the tile is covered', () => {
			startBlackout();
			draw.source.state.set({ blocked: true, removable: false });
			fixture.detectChanges();

			expect(component.covered()).toBe(true);
			const back = fixture.debugElement.query(By.css('use.back'));
			expect(back.attributes['xlink:href']).toBe('#mah-tile-back');
			// the title renders as a hover tooltip, which would give the covered face away
			expect(fixture.debugElement.query(By.css('title'))).toBeNull();
		});

		it('should show the face again once the tile is free', () => {
			startBlackout();
			draw.source.state.set({ blocked: true, removable: false });
			fixture.detectChanges();
			draw.source.state.set({ blocked: false, removable: true });
			fixture.detectChanges();

			expect(component.covered()).toBe(false);
			expect(fixture.debugElement.query(By.css('use.back'))).toBeNull();
			expect(fixture.debugElement.query(By.css('title'))).toBeTruthy();
		});

		it('should keep every face visible in a challenge that is not Blackout', () => {
			draw.source.state.set({ blocked: true, removable: false });
			fixture.detectChanges();

			expect(component.covered()).toBe(false);
		});

		it('should pick the dark back in the dark theme', () => {
			expect(component.backUrl()).toBe('#mah-tile-back');
			appService.settings.dark.set(true);
			expect(component.backUrl()).toBe('#mah-tile-back-dark');
		});
	});

	describe('Concealed', () => {
		function conceal(): void {
			fixture.componentRef.setInput('concealed', true);
			fixture.detectChanges();
		}

		it('should draw a back for a free tile, so a paused countdown reveals nothing', () => {
			draw.source.state.set({ blocked: false, removable: true });
			fixture.detectChanges();
			expect(component.covered()).toBe(false);

			conceal();

			expect(component.covered()).toBe(true);
			expect(fixture.debugElement.query(By.css('use.back'))).toBeTruthy();
			expect(fixture.debugElement.query(By.css('title'))).toBeNull();
		});

		it('should drop the mark, since the objective tile would give itself away', () => {
			draw.source.mark.set('spark');
			fixture.detectChanges();
			expect(fixture.nativeElement.dataset.mark).toBe('spark');

			conceal();

			expect(component.mark()).toBeUndefined();
			expect(fixture.nativeElement.dataset.mark).toBeUndefined();
			expect(fixture.debugElement.query(By.css('rect.mark-aura'))).toBeNull();
		});

		it('should name and reach nothing, so the label cannot be read out either', () => {
			draw.source.state.set({ blocked: false, removable: true });
			fixture.detectChanges();
			expect(fixture.nativeElement.getAttribute('aria-label')).toBeTruthy();

			conceal();

			expect(component.interactive()).toBe(false);
			expect(component.announced()).toBe(false);
			expect(fixture.nativeElement.getAttribute('aria-label')).toBeNull();
			expect(fixture.nativeElement.getAttribute('tabindex')).toBeNull();
			expect(fixture.nativeElement.getAttribute('role')).toBeNull();
		});

		it('should show the face again once the game resumes', () => {
			draw.source.state.set({ blocked: false, removable: true });
			conceal();
			fixture.componentRef.setInput('concealed', false);
			fixture.detectChanges();

			expect(component.covered()).toBe(false);
			expect(fixture.debugElement.query(By.css('use.back'))).toBeNull();
			expect(fixture.debugElement.query(By.css('title'))).toBeTruthy();
		});
	});

	it('should offset the 3D side down and to the right, behind the face', () => {
		appService.settings.tile3d.set(true);
		fixture.detectChanges();

		const rects = [...fixture.nativeElement.querySelectorAll('rect')] as Array<SVGRectElement>;
		const side = rects.find(rect => rect.classList.contains('side'));
		const stone = rects.find(rect => rect.classList.contains('stone'));
		expect(side).toBeTruthy();
		expect(stone).toBeTruthy();

		expect(Number(side!.getAttribute('x'))).toBeGreaterThan(0);
		expect(Number(side!.getAttribute('y'))).toBeGreaterThan(0);
		expect(Number(side!.getAttribute('width'))).toBe(CONSTS.tileWidth);
		expect(Number(side!.getAttribute('height'))).toBe(CONSTS.tileHeight);
		// drawn first so the face covers all but the protruding edge
		expect(rects.indexOf(side!)).toBeLessThan(rects.indexOf(stone!));
	});

	it('should draw no side rect when 3D is off', () => {
		appService.settings.tile3d.set(false);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('rect.side')).toBeNull();
	});

	it('should memoize the aria label and recompute on hinted or language change', () => {
		const instantSpy = vi.spyOn(appService.translate, 'instant');

		// already computed during the initial render, reads are served from cache
		expect(component.tileLabel()).toBe('TILE_LABEL');
		expect(instantSpy).not.toHaveBeenCalled();

		draw.source.hinted.set(true);
		expect(component.tileLabel()).toBe('TILE_LABEL_HINTED');
		expect(instantSpy).toHaveBeenCalled();

		instantSpy.mockClear();
		appService.lang.set('de');
		expect(component.tileLabel()).toBe('TILE_LABEL_HINTED');
		expect(instantSpy).toHaveBeenCalled();
	});
});
