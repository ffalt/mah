import { Directive, ElementRef, type AfterViewInit, type OnDestroy, inject } from '@angular/core';
import { DeferLoadService } from './defer-load.service';

@Directive({ selector: '[appDeferLoadScrollHost]' })
export class DeferLoadScrollHostDirective implements AfterViewInit, OnDestroy {
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
}
