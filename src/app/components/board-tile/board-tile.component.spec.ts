import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { Stone } from '../../model/stone';
import { type Draw, calcDrawPos } from '../../model/draw';
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
