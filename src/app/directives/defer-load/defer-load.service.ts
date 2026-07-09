import { isPlatformBrowser } from '@angular/common';
import { EventEmitter, Service, PLATFORM_ID, inject } from '@angular/core';
import { type Observable, Subject, merge, debounceTime, throttleTime } from 'rxjs';
import { Rect } from './rect';

interface ScrollEvent {
	name: string;
	element?: HTMLElement;
}

export interface ScrollNotifyEvent {
	rect: Rect;
}

@Service()
export class DeferLoadService {
	scrollNotify = new EventEmitter<ScrollNotifyEvent>();
	currentViewport: Rect = new Rect(0, 0, 0, 0);
	readonly isBrowser: boolean;
	readonly hasIntersectionObserver: boolean;
	private readonly scrollSubject = new Subject<ScrollNotifyEvent>();
	private readonly scrollObservable: Observable<ScrollNotifyEvent>;
	private readonly platformId = inject(PLATFORM_ID);
	private readonly intersectionCallbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
	private intersectionObserver?: IntersectionObserver;

	constructor() {
		this.isBrowser = isPlatformBrowser(this.platformId);
		this.hasIntersectionObserver = DeferLoadService.checkIntersectionObserver();
		const observable = this.scrollSubject.asObservable();
		this.scrollObservable =
			merge(
				observable.pipe(throttleTime(300)),
				observable.pipe(debounceTime(100))
			);
		this.scrollObservable
			.subscribe(x => {
				this.scrollNotify.emit(x);
			});
		this.currentViewport = Rect.fromWindow(window);
	}

	observe(element: Element, callback: (entry: IntersectionObserverEntry) => void): void {
		this.intersectionCallbacks.set(element, callback);
		this.getObserver().observe(element);
	}

	unobserve(element: Element): void {
		this.intersectionCallbacks.delete(element);
		this.intersectionObserver?.unobserve(element);
	}

	private getObserver(): IntersectionObserver {
		// entries are routed directly to their element's callback, not broadcast to all observers
		this.intersectionObserver ??= new IntersectionObserver(entries => {
			for (const entry of entries) {
				this.intersectionCallbacks.get(entry.target)?.(entry);
			}
		}, { threshold: 0 });
		return this.intersectionObserver;
	}

	notifyScroll(event: ScrollEvent): void {
		if (this.hasIntersectionObserver) {
			return;
		}
		const rect = event.element ? Rect.fromElement(event.element) : Rect.fromWindow(window);
		const height = (rect.bottom - rect.top);
		rect.bottom += height;
		rect.top -= height;
		this.currentViewport = rect;
		this.scrollSubject.next({ rect });
	}

	private static checkIntersectionObserver(): boolean {
		const hasIntersectionObserver = 'IntersectionObserver' in window;
		const userAgent = window.navigator.userAgent;
		const matches = userAgent.match(/Edge\/(\d*)\./i);
		const isEdge = !!matches && matches.length > 1;
		const isEdgeVersion16OrBetter = isEdge && (!!matches && Math.trunc(Number(matches[1])) > 15);
		return hasIntersectionObserver && (!isEdge || isEdgeVersion16OrBetter);
	}
}
