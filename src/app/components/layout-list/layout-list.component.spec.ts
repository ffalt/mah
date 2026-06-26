import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
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

	it('updates the mirror signal when changed', () => {
		component.randomMirrorXSet('true');
		expect(component.randomMirrorX()).toBe('true');

		component.randomMirrorYSet('false');
		expect(component.randomMirrorY()).toBe('false');
	});

	// OnPush: the random previews are produced inside async setTimeout callbacks
	it('fills random layout previews asynchronously', () => {
		vi.useFakeTimers();
		try {
			component.generateRandomLayouts();
			vi.runAllTimers();
		} finally {
			vi.useRealTimers();
		}

		expect(component.randomGroup.layouts.length).toBeGreaterThan(0);
		expect(component.randomGroup.layouts.every(item => !!item.layout.previewSVG)).toBe(true);
	});
});
