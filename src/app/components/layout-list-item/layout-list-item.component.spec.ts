import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DeferLoadDirective } from '../../directives/defer-load/defer-load.directive';
import { DeferLoadService } from '../../directives/defer-load/defer-load.service';
import type { LayoutItem, RandomLayoutItem } from '../layout-list/layout-list.component';
import type { SafeUrlSVG } from '../../model/types';
import { LayoutListItemComponent } from './layout-list-item.component';

function makeItem(): LayoutItem {
	return {
		layout: { id: 'l1', name: 'Layout 1', category: 'Cat', mapping: [], custom: true },
		visible: signal(false),
		selected: signal(false),
		bestTime: 61_000
	};
}

function makeRandomItem(): RandomLayoutItem {
	return {
		layout: { id: 'random-0', name: 'Random 1', category: 'Random', mapping: [] },
		visible: signal(false),
		selected: signal(false),
		layoutSeed: signal('seed-1'),
		previewSVG: signal<SafeUrlSVG | undefined>(undefined)
	};
}

describe('LayoutListItemComponent', () => {
	let component: LayoutListItemComponent;
	let fixture: ComponentFixture<LayoutListItemComponent>;
	let item: LayoutItem;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [LayoutListItemComponent],
			providers: [provideTranslateService(), { provide: DeferLoadService, useValue: { isBrowser: false } }]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutListItemComponent);
		component = fixture.componentInstance;
		item = makeItem();
		fixture.componentRef.setInput('item', item);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should show the placeholder until the defer load reveals the preview', () => {
		expect(fixture.nativeElement.querySelector(':scope .preview-placeholder')).toBeTruthy();
		expect(fixture.nativeElement.querySelector(':scope app-layout-preview')).toBeNull();

		fixture.debugElement.injector.get(DeferLoadDirective).appDeferLoad.emit();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector(':scope .preview-placeholder')).toBeNull();
		expect(fixture.nativeElement.querySelector(':scope app-layout-preview')).toBeTruthy();
	});

	it('should reflect the selection on the host element', () => {
		expect(fixture.nativeElement.classList.contains('selected')).toBe(false);
		item.selected.set(true);
		fixture.detectChanges();
		expect(fixture.nativeElement.classList.contains('selected')).toBe(true);
		expect(fixture.nativeElement.getAttribute('aria-pressed')).toBe('true');
	});

	it('should emit startEvent on activation', () => {
		const startSpy = vi.fn();
		component.startEvent.subscribe(startSpy);
		fixture.nativeElement.click();
		expect(startSpy).toHaveBeenCalled();
	});

	it('should emit clear and remove events from the card buttons', () => {
		const clearSpy = vi.fn();
		const removeSpy = vi.fn();
		component.clearBestTimeEvent.subscribe(clearSpy);
		component.customDeleteEvent.subscribe(removeSpy);

		(fixture.nativeElement.querySelector(':scope .preview-best-time button') as HTMLElement).click();
		expect(clearSpy).toHaveBeenCalled();

		(fixture.nativeElement.querySelector(':scope .preview-custom-delete') as HTMLElement).click();
		expect(removeSpy).toHaveBeenCalled();
	});

	it('should render the seed input and emit seed changes for random items', () => {
		const randomItem = makeRandomItem();
		fixture.componentRef.setInput('item', randomItem);
		fixture.componentRef.setInput('random', true);
		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector(':scope .seed-input') as HTMLInputElement;
		expect(input.value).toBe('seed-1');

		const seedSpy = vi.fn();
		component.seedEvent.subscribe(seedSpy);
		input.value = 'new-seed';
		input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
		expect(seedSpy).toHaveBeenCalledWith('new-seed');
	});
});
