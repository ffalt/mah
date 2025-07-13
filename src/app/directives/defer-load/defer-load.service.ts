import { isPlatformBrowser } from '@angular/common';
import { EventEmitter, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { type Observable, Subject, merge } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { Rect } from './rect';

interface ScrollEvent {
	name: string;
	element?: HTMLElement;
}

export interface ScrollNotifyEvent {
	rect: Rect;
}

@Injectable({
	providedIn: 'root'
})
export class DeferLoadService {
	scrollNotify = new EventEmitter<ScrollNotifyEvent>();
	observeNotify = new EventEmitter<Array<IntersectionObserverEntry>>();
	currentViewport: Rect = new Rect(0, 0, 0, 0);
	readonly isBrowser: boolean;
	readonly hasIntersectionObserver: boolean;
	private readonly scrollSubject = new Subject<ScrollNotifyEvent>();
	private readonly scrollObservable: Observable<ScrollNotifyEvent>;
	private readonly platformId = inject(PLATFORM_ID);
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

	getObserver(): IntersectionObserver {
		if (this.intersectionObserver) {
			return this.intersectionObserver;
		}
		this.intersectionObserver = new IntersectionObserver(entries => {
			this.observeNotify.next(entries);
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
		const isEdgeVersion16OrBetter = isEdge && (!!matches && Number.parseInt(matches[1], 10) > 15);
		return hasIntersectionObserver && (!isEdge || isEdgeVersion16OrBetter);
	}
}
