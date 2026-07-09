import { Directive, ElementRef, type AfterViewInit, type OnChanges, type OnDestroy, type SimpleChange, inject, input } from '@angular/core';
import { DeferLoadService } from './defer-load.service';

@Directive({ selector: '[appDeferLoadScrollHost]' })
export class DeferLoadScrollHostDirective implements OnChanges, AfterViewInit, OnDestroy {
	readonly scrollTo = input<HTMLElement>();
	private readonly element = inject(ElementRef);
	private readonly scrollNotify = inject(DeferLoadService);
	// attached imperatively so scrolling never triggers change detection; only the non-IntersectionObserver fallback needs scroll events at all
	private readonly scrollListener = () => this.scrollNotify.notifyScroll({ name: 'scroll-host', element: this.element.nativeElement });

	ngAfterViewInit(): void {
		if (!this.scrollNotify.hasIntersectionObserver) {
			this.element.nativeElement.addEventListener('scroll', this.scrollListener, { passive: true });
		}
	}

	ngOnDestroy(): void {
		this.element.nativeElement.removeEventListener('scroll', this.scrollListener);
	}

	ngOnChanges(changes: { [propName: string]: SimpleChange }): void {
		if (!changes.scrollTo?.currentValue) {
			return;
		}

		const o = changes.scrollTo.currentValue;
		if (o.id && o.id.length > 0) {
			const elm = document.getElementById(o.id);
			if (elm) {
				this.element.nativeElement.scrollTop = elm.offsetTop - elm.offsetHeight;
			}
		}
	}
}
