import { afterNextRender, Component, effect, type ElementRef, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TranslateGroupPipe } from '../../pipes/translate-group.pipe';

export interface ChipItem {
	name: string;
	isRandom?: boolean;
}

const DRAG_THRESHOLD = 4;

@Component({
	selector: 'app-chip-bar',
	templateUrl: './chip-bar.component.html',
	styleUrls: ['./chip-bar.component.scss'],
	imports: [TranslatePipe, TranslateGroupPipe]
})
export class ChipBarComponent {
	readonly items = input<Array<ChipItem>>([]);
	readonly anchorPrefix = input('chip-');
	readonly navLabel = input('');
	readonly revealIndex = input(-1);
	readonly itemSelected = output<number>();
	readonly wheelPastEnd = output<number>();

	readonly expanded = signal(false);
	readonly chipsOverflow = signal(true);
	readonly canScrollLeft = signal(false);
	readonly canScrollRight = signal(false);
	readonly dragActive = signal(false);
	readonly navBar = viewChild<ElementRef<HTMLElement>>('navBar');

	private dragState: { pointerId: number; startX: number; startScrollLeft: number; moved: boolean } | undefined;
	private suppressClick = false;
	protected readonly translate = inject(TranslateService);

	constructor() {
		afterNextRender(() => this.updateArrows());
		this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
			setTimeout(() => this.updateArrows(), 0);
		});
		effect(() => {
			this.items();
			setTimeout(() => this.updateArrows(), 0);
		});
		effect(() => {
			const index = this.revealIndex();
			if (index < 0 || untracked(this.expanded)) {
				return;
			}
			this.revealChip(index);
		});
	}

	selectItem(event: Event, index: number): void {
		event.preventDefault();
		if (this.suppressClick) {
			this.suppressClick = false;
			return;
		}
		this.expanded.set(false);
		this.itemSelected.emit(index);
		setTimeout(() => this.updateArrows(), 0);
	}

	scrollChips(direction: number): void {
		const nav = this.navBar()?.nativeElement;
		if (!nav) {
			return;
		}
		nav.scrollBy({ left: direction * nav.clientWidth * 0.8, behavior: 'smooth' });
		setTimeout(() => this.updateArrows(), 350);
	}

	onNavScroll(): void {
		this.updateArrows();
	}

	onNavWheel(event: WheelEvent): void {
		const nav = this.navBar()?.nativeElement;
		if (!nav || this.expanded() || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
			return;
		}
		event.preventDefault();
		const delta = this.wheelPixels(event, nav);
		const atStart = delta < 0 && nav.scrollLeft <= 0;
		const atEnd = delta > 0 && nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 1;
		if (atStart || atEnd) {
			this.wheelPastEnd.emit(delta);
			return;
		}
		nav.scrollLeft += delta;
		this.updateArrows();
	}

	// touch swipes natively on overflow-x; drag scrolling is only added for mouse and pen
	onNavPointerDown(event: PointerEvent): void {
		const nav = this.navBar()?.nativeElement;
		if (!nav || event.pointerType === 'touch' || event.button > 0 || this.expanded()) {
			return;
		}
		this.suppressClick = false;
		this.dragState = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: nav.scrollLeft, moved: false };
	}

	onNavPointerMove(event: PointerEvent): void {
		const drag = this.dragState;
		const nav = this.navBar()?.nativeElement;
		if (!drag || !nav || event.pointerId !== drag.pointerId) {
			return;
		}
		if (event.buttons === 0) {
			this.dragState = undefined;
			return;
		}
		const delta = event.clientX - drag.startX;
		if (!drag.moved) {
			if (Math.abs(delta) <= DRAG_THRESHOLD) {
				return;
			}
			drag.moved = true;
			this.dragActive.set(true);
			nav.setPointerCapture?.(event.pointerId);
		}
		nav.scrollLeft = drag.startScrollLeft - delta;
	}

	onNavPointerUp(event: PointerEvent): void {
		const drag = this.dragState;
		if (!drag || event.pointerId !== drag.pointerId) {
			return;
		}
		this.suppressClick = drag.moved;
		if (drag.moved) {
			setTimeout(() => {
				this.suppressClick = false;
			}, 0);
		}
		this.dragState = undefined;
		this.dragActive.set(false);
	}

	toggleShowAll(): void {
		this.expanded.update(value => !value);
		setTimeout(() => this.updateArrows(), 0);
	}

	updateArrows(): void {
		const nav = this.navBar()?.nativeElement;
		if (!nav || nav.clientWidth === 0) {
			return;
		}
		const expanded = this.expanded();
		const overflow = expanded || nav.scrollWidth > nav.clientWidth + 1;
		this.chipsOverflow.set(overflow);
		this.canScrollLeft.set(!expanded && overflow && nav.scrollLeft > 0);
		this.canScrollRight.set(!expanded && overflow && nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1);
	}

	private revealChip(index: number): void {
		const chip = this.navBar()?.nativeElement.querySelectorAll('a')[index];
		chip?.scrollIntoView?.({ behavior: 'smooth', inline: 'start', block: 'nearest' });
	}

	private wheelPixels(event: WheelEvent, nav: HTMLElement): number {
		switch (event.deltaMode) {
			case WheelEvent.DOM_DELTA_LINE: {
				return event.deltaY * 16;
			}
			case WheelEvent.DOM_DELTA_PAGE: {
				return event.deltaY * nav.clientWidth;
			}
			default: {
				return event.deltaY;
			}
		}
	}
}
