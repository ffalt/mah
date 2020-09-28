import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {Subscription} from 'rxjs';
import {DeferLoadService, ScrollNotifyEvent} from './defer-load.service';
import {Rect} from './rect';

@Directive({
	selector: '[appDeferLoad]'
})
export class DeferLoadDirective implements AfterViewInit, OnDestroy {

	@Input() preRender: boolean = false;
	@Output() readonly appDeferLoad: EventEmitter<any> = new EventEmitter();

	private intersectionObserver?: IntersectionObserver;
	private scrollSubscription?: Subscription;
	private onbserveSubscription?: Subscription;
	private timeoutId?: number;
	private timeoutLoadMS: number = 20;

	constructor(private _element: ElementRef, private deferLoadService: DeferLoadService) {
	}

	ngAfterViewInit(): void {
		if (this.deferLoadService.isBrowser) {
			if (this.deferLoadService.hasIntersectionObserver) {
				this.registerIntersectionObserver();
			} else {
				this.addScrollListeners();
			}
		} else if (this.preRender) {
			this.load();
		}
	}

	ngOnDestroy(): void {
		this.removeListeners();
	}

	private static getScrollPosition(): number {
		// Getting screen size and scroll position for IE
		return (window.scrollY || window.pageYOffset)
			+ (document.documentElement.clientHeight || document.body.clientHeight);
	}

	private loadAndUnobserve(): void {
		this.load();
		this.unobserve();
		this.removeListeners();
	}

	private cancelDelayLoad(): void {
		if (!this.timeoutId) {
			return; // do nothing if timeout doesn't exist
		}
		clearTimeout(this.timeoutId);
		this.timeoutId = undefined;
	}

	private delayLoad(): void {
		if (this.timeoutId) {
			return; // timeout was already set, do nothing
		}
		this.timeoutId = setTimeout(() => {
			this.loadAndUnobserve();
			this.cancelDelayLoad();
		}, this.timeoutLoadMS) as any;
	}

	private manageIntersection(entry: IntersectionObserverEntry): void {
		if (this.checkIfIntersecting(entry)) {
			this.delayLoad();
		} else {
			this.cancelDelayLoad();
		}
	}

	private registerIntersectionObserver(): void {
		if (!!this.intersectionObserver) {
			return;
		}
		this.intersectionObserver = this.deferLoadService.getObserver();
		if (this.intersectionObserver && this._element.nativeElement) {
			this.intersectionObserver.observe(this._element.nativeElement as Element);
			this.onbserveSubscription = this.deferLoadService.observeNotify
				.subscribe((entries: Array<IntersectionObserverEntry>) => {
					this.checkForIntersection(entries);
				});
		}
	}

	private checkForIntersection = (entries: Array<IntersectionObserverEntry>) => {
		entries.forEach((entry: IntersectionObserverEntry) => {
			if (entry.target === this._element.nativeElement) {
				this.manageIntersection(entry);
			}
		});
	};

	private checkIfIntersecting(entry: IntersectionObserverEntry): boolean {
		// For Samsung native browser, IO has been partially implemented where by the
		// callback fires, but entry object is empty. We will check manually.
		if (entry && entry.time) {
			return entry.isIntersecting;
		}
		return this.isVisible();
	}

	private load(): void {
		this.removeListeners();
		this.appDeferLoad.emit();
	}

	private loadFromScroll(): void {
		setTimeout(() => {
			this.load();
		});
	}

	private addScrollListeners(): void {
		this.scrollSubscription = this.deferLoadService.scrollNotify
			.subscribe((event: ScrollNotifyEvent) => {
				if (this.checkInView(event.rect)) {
					this.loadFromScroll();
				}
			});
		setTimeout(() => {
			if (this.checkInView(this.deferLoadService.currentViewport)) {
				this.loadFromScroll();
			}
		});
	}

	private unobserve(): void {
		if (this.intersectionObserver && this._element.nativeElement) {
			this.intersectionObserver.unobserve(this._element.nativeElement as Element);
			this.intersectionObserver = undefined;
		}
	}

	private removeListeners(): void {
		if (this.scrollSubscription) {
			this.scrollSubscription.unsubscribe();
			this.scrollSubscription = undefined;
		}
		this.unobserve();
		if (this.onbserveSubscription) {
			this.onbserveSubscription.unsubscribe();
			this.onbserveSubscription = undefined;
		}
	}

	private checkInView(rect: Rect): boolean {
		const elemRect = Rect.fromElement(this._element.nativeElement);
		return elemRect.intersectsWithY(rect);
	}

	private isVisible(): boolean {
		const scrollPosition = DeferLoadDirective.getScrollPosition();
		const elementOffset = this._element.nativeElement.offsetTop;
		return elementOffset <= scrollPosition;
	}
}
