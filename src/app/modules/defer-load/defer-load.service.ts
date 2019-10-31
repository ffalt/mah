import {isPlatformBrowser} from '@angular/common';
import {EventEmitter, Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, throttleTime} from 'rxjs/operators';
import {Rect} from './rect';

export interface ScrollEvent {
	name: string;
	element?: any;
}

export interface ScrollNotifyEvent {
	rect: Rect;
}

@Injectable({
	providedIn: 'root'
})
export class DeferLoadService {
	notify = new EventEmitter<ScrollNotifyEvent>();
	currentViewport: Rect = new Rect(0, 0, 0, 0);
	readonly isBrowser: boolean;
	readonly hasIntersectionObserver: boolean;
	private scrollSubject = new Subject<ScrollNotifyEvent>();
	private scrollObservable: Observable<ScrollNotifyEvent>;

	constructor(@Inject(PLATFORM_ID) private platformId: object) {
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
				this.notify.emit(x);
			});
		this.currentViewport = Rect.fromWindow(window);
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
		this.scrollSubject.next({rect});
	}

	private static checkIntersectionObserver(): boolean {
		const hasIntersectionObserver = 'IntersectionObserver' in window;
		const userAgent = window.navigator.userAgent;
		const matches = userAgent.match(/Edge\/(\d*)\./i);
		const isEdge = !!matches && matches.length > 1;
		const isEdgeVersion16OrBetter = isEdge && (!!matches && parseInt(matches[1], 10) > 15);
		return hasIntersectionObserver && (!isEdge || isEdgeVersion16OrBetter);
	}

}
