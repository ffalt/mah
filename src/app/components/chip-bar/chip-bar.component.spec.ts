import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { ChipBarComponent, type ChipItem } from './chip-bar.component';
import { describe, beforeEach, it, expect, vi } from 'vitest';

const ITEMS: Array<ChipItem> = [
	{ name: 'Cat1' },
	{ name: 'Cat2' },
	{ name: 'Cat3' },
	{ name: '', isRandom: true }
];

describe('ChipBarComponent', () => {
	let component: ChipBarComponent;
	let fixture: ComponentFixture<ChipBarComponent>;

	const native = () => fixture.nativeElement as HTMLElement;
	const nav = () => component.navBar()?.nativeElement as HTMLElement;
	const chips = () => native().querySelectorAll<HTMLElement>(':scope .headline-anchors a');

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ChipBarComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting()]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ChipBarComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('items', ITEMS);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
		expect(chips().length).toBe(ITEMS.length);
	});

	it('expands and collapses via the show-all toggle', () => {
		const wrap = () => native().querySelector('.chipbar-wrap');
		const toggle = () => native().querySelector('.show-all-toggle') as HTMLElement;
		expect(wrap()?.classList.contains('expanded')).toBe(false);
		expect(toggle().getAttribute('aria-expanded')).toBe('false');

		toggle().click();
		fixture.detectChanges();

		expect(wrap()?.classList.contains('expanded')).toBe(true);
		expect(toggle().getAttribute('aria-expanded')).toBe('true');

		toggle().click();
		fixture.detectChanges();

		expect(wrap()?.classList.contains('expanded')).toBe(false);
	});

	it('emits the selected index and collapses the expanded bar on chip click', () => {
		const selected: Array<number> = [];
		component.itemSelected.subscribe(index => {
			selected.push(index);
		});
		component.expanded.set(true);
		fixture.detectChanges();

		chips()[1].click();
		fixture.detectChanges();

		expect(selected).toEqual([1]);
		expect(component.expanded()).toBe(false);
	});

	it('scrolls the chip at revealIndex to the first position', () => {
		let revealed: HTMLElement | undefined;
		let options: ScrollIntoViewOptions | undefined;
		for (const chip of chips()) {
			chip.scrollIntoView = (argument_?: ScrollIntoViewOptions) => {
				revealed = chip;
				options = argument_;
			};
		}

		fixture.componentRef.setInput('revealIndex', 1);
		fixture.detectChanges();

		expect(revealed).toBe(chips()[1]);
		expect(options?.inline).toBe('start');
	});

	it('hides arrows and the show-all toggle when every chip fits without scrolling', () => {
		Object.defineProperties(nav(), {
			scrollWidth: { get: () => 300 },
			clientWidth: { get: () => 300 }
		});

		component.updateArrows();
		fixture.detectChanges();

		expect(native().querySelector('.chip-arrow')).toBeNull();
		expect(native().querySelector('.show-all-toggle')).toBeNull();
	});

	it('keeps the show-all toggle while expanded even when the chips fit', () => {
		Object.defineProperties(nav(), {
			scrollWidth: { get: () => 300 },
			clientWidth: { get: () => 300 }
		});

		component.expanded.set(true);
		component.updateArrows();
		fixture.detectChanges();

		expect(native().querySelector('.show-all-toggle')).not.toBeNull();
	});

	it('centers the chips when they all fit', () => {
		Object.defineProperties(nav(), {
			scrollWidth: { get: () => 300 },
			clientWidth: { get: () => 300 }
		});

		component.updateArrows();
		fixture.detectChanges();

		expect(nav().classList.contains('fits')).toBe(true);
	});

	it('translates vertical wheel delta into horizontal chip scrolling', () => {
		let scrollLeft = 100;
		Object.defineProperties(nav(), {
			scrollWidth: { get: () => 800 },
			clientWidth: { get: () => 300 },
			scrollLeft: {
				get: () => scrollLeft,
				set: value => {
					scrollLeft = value;
				}
			}
		});

		const event = new WheelEvent('wheel', { deltaY: 60, cancelable: true });
		nav().dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(scrollLeft).toBe(160);
	});

	it('emits the wheel delta when the bar cannot scroll further', () => {
		const deltas: Array<number> = [];
		component.wheelPastEnd.subscribe(delta => {
			deltas.push(delta);
		});
		Object.defineProperties(nav(), {
			scrollWidth: { get: () => 800 },
			clientWidth: { get: () => 300 },
			scrollLeft: { get: () => 0, set: () => undefined }
		});

		const event = new WheelEvent('wheel', { deltaY: -60, cancelable: true });
		nav().dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(deltas).toEqual([-60]);
	});

	it('scrolls the bar by mouse dragging', () => {
		let scrollLeft = 50;
		Object.defineProperty(nav(), 'scrollLeft', {
			get: () => scrollLeft,
			set: value => {
				scrollLeft = value;
			}
		});

		component.onNavPointerDown({ pointerType: 'mouse', pointerId: 1, clientX: 100 } as unknown as PointerEvent);
		component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 97 } as unknown as PointerEvent);
		expect(scrollLeft).toBe(50); // below the drag threshold

		component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 70 } as unknown as PointerEvent);
		expect(scrollLeft).toBe(80);
		expect(component.dragActive()).toBe(true);

		component.onNavPointerUp({ pointerType: 'mouse', pointerId: 1 } as unknown as PointerEvent);
		expect(component.dragActive()).toBe(false);
	});

	it('ignores touch pointer drags because native scrolling handles them', () => {
		let scrollLeft = 50;
		Object.defineProperty(nav(), 'scrollLeft', {
			get: () => scrollLeft,
			set: value => {
				scrollLeft = value;
			}
		});

		component.onNavPointerDown({ pointerType: 'touch', pointerId: 1, clientX: 100 } as unknown as PointerEvent);
		component.onNavPointerMove({ pointerType: 'touch', pointerId: 1, clientX: 40 } as unknown as PointerEvent);

		expect(scrollLeft).toBe(50);
		expect(component.dragActive()).toBe(false);
	});

	it('suppresses the chip click that follows a drag, but not the next plain click', () => {
		const selected: Array<number> = [];
		component.itemSelected.subscribe(index => {
			selected.push(index);
		});
		component.onNavPointerDown({ pointerType: 'mouse', pointerId: 1, clientX: 100 } as unknown as PointerEvent);
		component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 40 } as unknown as PointerEvent);
		component.onNavPointerUp({ pointerType: 'mouse', pointerId: 1 } as unknown as PointerEvent);

		chips()[1].click();
		fixture.detectChanges();
		expect(selected).toEqual([]);

		chips()[1].click();
		fixture.detectChanges();
		expect(selected).toEqual([1]);
	});

	it('disarms the click suppression when the trailing click lands on the bar padding', () => {
		vi.useFakeTimers();
		try {
			const selected: Array<number> = [];
			component.itemSelected.subscribe(index => {
				selected.push(index);
			});
			component.onNavPointerDown({ pointerType: 'mouse', pointerId: 1, clientX: 100, button: 0 } as unknown as PointerEvent);
			component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 40, buttons: 1 } as unknown as PointerEvent);
			component.onNavPointerUp({ pointerType: 'mouse', pointerId: 1 } as unknown as PointerEvent);

			// the trailing click is still suppressed
			chips()[1].click();
			expect(selected).toEqual([]);

			// but the suppression disarms itself, so the next real click works
			vi.runAllTimers();
			chips()[1].click();
			expect(selected).toEqual([1]);
		} finally {
			vi.useRealTimers();
		}
	});

	it('ignores non-primary-button pointer downs', () => {
		let scrollLeft = 50;
		Object.defineProperty(nav(), 'scrollLeft', {
			get: () => scrollLeft,
			set: value => {
				scrollLeft = value;
			}
		});

		component.onNavPointerDown({ pointerType: 'mouse', pointerId: 1, clientX: 100, button: 2 } as unknown as PointerEvent);
		component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 40, buttons: 2 } as unknown as PointerEvent);

		expect(scrollLeft).toBe(50);
	});

	it('tears down a pending drag when the button was released off the bar', () => {
		let scrollLeft = 50;
		Object.defineProperty(nav(), 'scrollLeft', {
			get: () => scrollLeft,
			set: value => {
				scrollLeft = value;
			}
		});

		component.onNavPointerDown({ pointerType: 'mouse', pointerId: 1, clientX: 100, button: 0 } as unknown as PointerEvent);
		// released off-element below the capture threshold; the next hover reports no buttons
		component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 99, buttons: 0 } as unknown as PointerEvent);
		component.onNavPointerMove({ pointerType: 'mouse', pointerId: 1, clientX: 40, buttons: 0 } as unknown as PointerEvent);

		expect(scrollLeft).toBe(50);
		expect(component.dragActive()).toBe(false);
	});

	it('normalizes line-based wheel deltas to pixels', () => {
		let scrollLeft = 100;
		Object.defineProperties(nav(), {
			scrollWidth: { get: () => 800 },
			clientWidth: { get: () => 300 },
			scrollLeft: {
				get: () => scrollLeft,
				set: value => {
					scrollLeft = value;
				}
			}
		});

		const event = new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true });
		nav().dispatchEvent(event);

		expect(scrollLeft).toBe(148);
	});

	it('recomputes the overflow when the language changes', () => {
		vi.useFakeTimers();
		try {
			let width = 300;
			Object.defineProperties(nav(), {
				scrollWidth: { get: () => width },
				clientWidth: { get: () => 300 }
			});
			component.updateArrows();
			expect(component.chipsOverflow()).toBe(false);

			width = 800;
			TestBed.inject(TranslateService).use('de');
			vi.runAllTimers();

			expect(component.chipsOverflow()).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('refreshes the arrows when a chip click collapses the bar', () => {
		vi.useFakeTimers();
		try {
			Object.defineProperties(nav(), {
				scrollWidth: { get: () => 800 },
				clientWidth: { get: () => 300 },
				scrollLeft: { get: () => 100, set: () => undefined }
			});
			component.expanded.set(true);
			component.updateArrows();
			expect(component.canScrollLeft()).toBe(false);

			chips()[0].click();
			vi.runAllTimers();

			expect(component.canScrollLeft()).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('does not re-reveal the stale index when the bar collapses', () => {
		let calls = 0;
		for (const chip of chips()) {
			chip.scrollIntoView = () => {
				calls++;
			};
		}
		fixture.componentRef.setInput('revealIndex', 1);
		fixture.detectChanges();
		expect(calls).toBe(1);

		component.expanded.set(true);
		fixture.detectChanges();
		component.expanded.set(false);
		fixture.detectChanges();

		expect(calls).toBe(1);
	});
});
