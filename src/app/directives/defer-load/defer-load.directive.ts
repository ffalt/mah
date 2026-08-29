import { type AfterViewInit, Directive, ElementRef, type OnDestroy, inject, input, output } from '@angular/core';
import type { Subscription } from 'rxjs';
import { DeferLoadService, type ScrollNotifyEvent } from './defer-load.service';
import { Rect } from './rect';

@Directive({ selector: '[appDeferLoad]' })
export class DeferLoadDirective implements AfterViewInit, OnDestroy {
	readonly preRender = input<boolean>(false);
	readonly appDeferLoad = output();
	private observing = false;
	private scrollSubscription?: Subscription;
	private timeoutId?: ReturnType<typeof setTimeout>;
	private readonly timeoutLoadMS: number = 20;
	private readonly elementRef = inject(ElementRef);
	private readonly deferLoadService = inject(DeferLoadService);

	ngAfterViewInit(): void {
		if (this.deferLoadService.isBrowser) {
			if (this.deferLoadService.hasIntersectionObserver) {
				this.registerIntersectionObserver();
			} else {
				this.addScrollListeners();
			}
		} else if (this.preRender()) {
			this.load();
		}
	}

	ngOnDestroy(): void {
		this.cancelDelayLoad();
		this.removeListeners();
	}

	private static getScrollPosition(): number {
		return window.scrollY + (document.documentElement.clientHeight || document.body.clientHeight);
	}

	private loadAndUnobserve(): void {
		this.load();
		this.unobserve();
		this.removeListeners();
	}

	private cancelDelayLoad(): void {
		if (!this.timeoutId) {
			return;
		}
		clearTimeout(this.timeoutId);
		this.timeoutId = undefined;
	}

	private delayLoad(): void {
		if (this.timeoutId) {
			return;
		}
		this.timeoutId = setTimeout(() => {
			this.loadAndUnobserve();
			this.cancelDelayLoad();
		}, this.timeoutLoadMS);
	}

	private manageIntersection(entry: IntersectionObserverEntry): void {
		if (this.checkIfIntersecting(entry)) {
			this.delayLoad();
		} else {
			this.cancelDelayLoad();
		}
	}

	private registerIntersectionObserver(): void {
		if (this.observing || !this.elementRef.nativeElement) {
			return;
		}
		this.observing = true;
		this.deferLoadService.observe(this.elementRef.nativeElement as Element, entry => this.manageIntersection(entry));
	}

	private checkIfIntersecting(entry: IntersectionObserverEntry): boolean {
		// For Samsung native browser, IO has been partially implemented whereby the
		// callback fires, but entry object is empty. We will check manually.
		if (entry?.time) {
			return entry.isIntersecting;
		}
		return this.isVisible();
	}

	private load(): void {
		this.removeListeners();
		this.appDeferLoad.emit();
	}

	private addScrollListeners(): void {
		this.scrollSubscription = this.deferLoadService.scrollNotify
			.subscribe((event: ScrollNotifyEvent) => {
				if (this.checkInView(event.rect)) {
					this.delayLoad();
				}
			});
		if (this.checkInView(this.deferLoadService.currentViewport)) {
			this.delayLoad();
		}
	}

	private unobserve(): void {
		if (!this.observing) {
			return;
		}
		this.observing = false;
		this.deferLoadService.unobserve(this.elementRef.nativeElement as Element);
	}

	private removeListeners(): void {
		if (this.scrollSubscription) {
			this.scrollSubscription.unsubscribe();
			this.scrollSubscription = undefined;
		}
		this.unobserve();
	}

	private checkInView(rect: Rect): boolean {
		const elementRect = Rect.fromElement(this.elementRef.nativeElement);
		return elementRect.intersectsWithY(rect);
	}

	private isVisible(): boolean {
		const scrollPosition = DeferLoadDirective.getScrollPosition();
		const elementOffset = this.elementRef.nativeElement.offsetTop;
		return elementOffset <= scrollPosition;
	}
}
