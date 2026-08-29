import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../service/layout.service';
import { LayoutListComponent } from './layout-list.component';
import type { Layout } from '../../model/types';
import { describe, beforeEach, it, expect, vi } from 'vitest';

const makeLayout = (id: string, category: string): Layout => ({
	id,
	name: id,
	category,
	mapping: [[0, 0, 0], [0, 2, 0]]
});

describe('LayoutListComponent', () => {
	let component: LayoutListComponent;
	let fixture: ComponentFixture<LayoutListComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [LayoutListComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	it('builds a group per category plus the random group from the layouts input', () => {
		fixture.componentRef.setInput('layouts', [makeLayout('A', 'Cat1'), makeLayout('B', 'Cat1'), makeLayout('C', 'Cat2')]);
		fixture.detectChanges();

		// Cat1 + Cat2 + the random group
		expect(component.groups().length).toBe(3);
		expect(component.groups().at(-1)?.isRandom).toBe(true);
	});

	it('removes a custom board through the service and rebuilds from the input binding', () => {
		const layoutService = TestBed.inject(LayoutService);
		const removeSpy = vi.spyOn(layoutService, 'removeCustomLayout').mockImplementation(() => undefined);
		vi.spyOn(window, 'confirm').mockReturnValue(true);
		fixture.componentRef.setInput('layouts', [makeLayout('A', 'Cat1'), makeLayout('B', 'Cat1')]);
		fixture.detectChanges();

		const buildSpy = vi.spyOn(component, 'buildGroups');
		component.removeCustom(component.groups()[0].layouts[0]);

		expect(removeSpy).toHaveBeenCalledWith(['A']);
		// rebuilding here would run against the stale input, so it must wait for the new array
		expect(buildSpy).not.toHaveBeenCalled();

		fixture.componentRef.setInput('layouts', [makeLayout('B', 'Cat1')]);
		fixture.detectChanges();

		expect(component.groups()[0].layouts.map(item => item.layout.id)).toEqual(['B']);
	});

	it('keeps the board when the delete confirmation is declined', () => {
		const layoutService = TestBed.inject(LayoutService);
		const removeSpy = vi.spyOn(layoutService, 'removeCustomLayout').mockImplementation(() => undefined);
		vi.spyOn(window, 'confirm').mockReturnValue(false);
		fixture.componentRef.setInput('layouts', [makeLayout('A', 'Cat1')]);
		fixture.detectChanges();

		component.removeCustom(component.groups()[0].layouts[0]);

		expect(removeSpy).not.toHaveBeenCalled();
	});

	it('keeps card reveal, selection and group collapse state across rebuilds', () => {
		fixture.componentRef.setInput('layouts', [makeLayout('A', 'Cat1'), makeLayout('B', 'Cat1')]);
		fixture.detectChanges();

		const group = component.groups()[0];
		group.expanded.set(false);
		group.layouts[0].visible.set(true);
		group.layouts[0].selected.set(true);

		component.buildGroups();

		const rebuilt = component.groups()[0];
		expect(rebuilt.expanded()).toBe(false);
		expect(rebuilt.layouts[0].visible()).toBe(true);
		expect(rebuilt.layouts[0].selected()).toBe(true);
		expect(rebuilt.layouts[1].visible()).toBe(false);
	});

	it('updates the mirror signal when changed', () => {
		component.randomMirrorXSet('true');
		expect(component.randomMirrorX()).toBe('true');

		component.randomMirrorYSet('false');
		expect(component.randomMirrorY()).toBe('false');
	});

	// the random previews are produced inside async setTimeout callbacks
	it('fills random layout previews asynchronously', () => {
		vi.useFakeTimers();
		try {
			component.generateRandomLayouts();
			vi.runAllTimers();
		} finally {
			vi.useRealTimers();
		}

		expect(component.randomGroup.layouts.length).toBeGreaterThan(0);
		expect(component.randomGroup.layouts.every(item => !!item.previewSVG())).toBe(true);
	});

	it('relabels the random group and its cards when the language changes', () => {
		const translate = TestBed.inject(TranslateService);
		translate.setTranslation('en', { RANDOM_GROUP: 'Random', RANDOM_LAYOUT: 'Board' });
		translate.setTranslation('de', { RANDOM_GROUP: 'Zufällig', RANDOM_LAYOUT: 'Brett' });
		fixture.componentRef.setInput('layouts', [makeLayout('A', 'Cat1')]);

		translate.use('en');
		fixture.detectChanges();
		const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
		const labels = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('.preview-seed-card')]
			.map(element => element.getAttribute('aria-label'));

		expect(text()).toContain('Random');
		expect(labels()).toContain('Board 1');

		translate.use('de');
		fixture.detectChanges();

		expect(text()).toContain('Zufällig');
		expect(text()).not.toContain('Random');
		expect(labels()).toContain('Brett 1');
	});

	it('relabels a board category when the language changes without recreating the component', () => {
		const translate = TestBed.inject(TranslateService);
		translate.setTranslation('en', { CAT_CAT1: 'Animals' });
		translate.setTranslation('de', { CAT_CAT1: 'Tiere' });
		fixture.componentRef.setInput('layouts', [makeLayout('A', 'Cat1')]);
		const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

		translate.use('en');
		fixture.detectChanges();
		expect(text()).toContain('Animals');

		translate.use('de');
		fixture.detectChanges();

		expect(text()).toContain('Tiere');
		expect(text()).not.toContain('Animals');
	});
});
