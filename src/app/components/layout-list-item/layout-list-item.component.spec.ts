import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { type Mock, describe, beforeEach, it, expect, vi } from 'vitest';
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

	describe('seed input for random items', () => {
		let input: HTMLInputElement;
		let seedSpy: Mock;

		function typeKey(value: string, key = 'a'): void {
			input.value = value;
			input.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
		}

		beforeEach(() => {
			const randomItem = makeRandomItem();
			fixture.componentRef.setInput('item', randomItem);
			fixture.componentRef.setInput('random', true);
			fixture.detectChanges();
			input = fixture.nativeElement.querySelector(':scope .seed-input') as HTMLInputElement;
			seedSpy = vi.fn();
			component.seedEvent.subscribe(seedSpy);
		});

		it('should render the current seed', () => {
			expect(input.value).toBe('seed-1');
		});

		it('should emit seed changes for random items', () => {
			typeKey('new-seed');
			expect(seedSpy).toHaveBeenCalledWith('new-seed');
		});

		it('should emit again for every keystroke that changes the seed', () => {
			typeKey('new-see');
			typeKey('new-seed');
			expect(seedSpy).toHaveBeenCalledTimes(2);
		});

		it.each(['ArrowLeft', 'Shift', 'Control', 'Tab', 'End'])('should skip the non-character key %s', key => {
			input.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
			expect(seedSpy).not.toHaveBeenCalled();
		});

		it('should skip a keystroke that leaves the seed as it was', () => {
			typeKey('seed-1');
			expect(seedSpy).not.toHaveBeenCalled();
		});

		it('should skip an empty field instead of regenerating', () => {
			typeKey('', 'Backspace');
			expect(seedSpy).not.toHaveBeenCalled();
		});

		it('should still emit for a deletion that leaves a seed behind', () => {
			typeKey('seed-', 'Backspace');
			expect(seedSpy).toHaveBeenCalledWith('seed-');
		});
	});
});
