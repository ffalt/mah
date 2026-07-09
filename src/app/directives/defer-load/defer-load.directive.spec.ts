import { Component, EventEmitter } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferLoadDirective } from './defer-load.directive';
import { DeferLoadService, type ScrollNotifyEvent } from './defer-load.service';
import { Rect } from './rect';
import { Mock, describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

@Component({
	template: `
		<div appDeferLoad (appDeferLoad)="onLoad()" [preRender]="preRender"></div>`,
	imports: [DeferLoadDirective]
})
class TestHostComponent {
	preRender = false;
	loadCount = 0;

	onLoad(): void {
		this.loadCount++;
	}
}

function makeMockService(overrides: Partial<DeferLoadService> = {}): Partial<DeferLoadService> {
	return {
		isBrowser: false,
		hasIntersectionObserver: false,
		scrollNotify: new EventEmitter<ScrollNotifyEvent>(),
		currentViewport: new Rect(0, 0, 1024, 768),
		observe: vi.fn(),
		unobserve: vi.fn(),
		...overrides
	};
}

describe('DeferLoadDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let component: TestHostComponent;
	let mockService: Partial<DeferLoadService>;

	function configure(serviceOverrides: Partial<DeferLoadService> = {}): void {
		mockService = makeMockService(serviceOverrides);
		TestBed.configureTestingModule({
			imports: [TestHostComponent],
			providers: [{ provide: DeferLoadService, useValue: mockService }]
		});
		fixture = TestBed.createComponent(TestHostComponent);
		component = fixture.componentInstance;
	}

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		TestBed.resetTestingModule();
	});

	it('should create', () => {
		configure();
		fixture.detectChanges();
		expect(component).toBeTruthy();
	});

	describe('server-side rendering (isBrowser = false)', () => {
		it('should not emit when preRender is false', () => {
			configure({ isBrowser: false });
			fixture.detectChanges();
			vi.runAllTimers();
			expect(component.loadCount).toBe(0);
		});

		it('should emit appDeferLoad when preRender is true', () => {
			configure({ isBrowser: false });
			component.preRender = true;
			fixture.detectChanges();
			expect(component.loadCount).toBe(1);
		});
	});

	describe('IntersectionObserver path', () => {
		beforeEach(() => {
			configure({ isBrowser: true, hasIntersectionObserver: true });
		});

		function intersectionCallback(): { element: Element; callback: (entry: IntersectionObserverEntry) => void } {
			const [element, callback] = (mockService.observe as Mock).mock.calls[0] as [Element, (entry: IntersectionObserverEntry) => void];
			return { element, callback };
		}

		it('should register the element with the service', () => {
			fixture.detectChanges();
			expect(mockService.observe).toHaveBeenCalledWith(fixture.nativeElement.querySelector('div'), expect.any(Function));
		});

		it('should emit after 20ms delay when element is intersecting', () => {
			fixture.detectChanges();
			const { element, callback } = intersectionCallback();
			callback({ time: 1, isIntersecting: true, target: element } as unknown as IntersectionObserverEntry);
			expect(component.loadCount).toBe(0);
			vi.advanceTimersByTime(20);
			expect(component.loadCount).toBe(1);
		});

		it('should cancel load if element leaves viewport before delay elapses', () => {
			fixture.detectChanges();
			const { element, callback } = intersectionCallback();
			// Enter viewport
			callback({ time: 1, isIntersecting: true, target: element } as unknown as IntersectionObserverEntry);
			// Leave before 20ms
			callback({ time: 2, isIntersecting: false, target: element } as unknown as IntersectionObserverEntry);
			vi.advanceTimersByTime(20);
			expect(component.loadCount).toBe(0);
		});

		it('should unobserve element after loading', () => {
			fixture.detectChanges();
			const { element, callback } = intersectionCallback();
			callback({ time: 1, isIntersecting: true, target: element } as unknown as IntersectionObserverEntry);
			vi.advanceTimersByTime(20);
			expect(mockService.unobserve).toHaveBeenCalledWith(element);
		});
	});

	describe('scroll listener path', () => {
		// Use a currentViewport that does not intersect the test element
		// so the initial on-init check in addScrollListeners does not trigger a load.
		const offscreenViewport = new Rect(0, -500, 1024, -1);

		it('should emit when the element is in the scrolled viewport', () => {
			configure({ isBrowser: true, hasIntersectionObserver: false, currentViewport: offscreenViewport });
			vi.spyOn(Rect, 'fromElement').mockReturnValue(new Rect(0, 100, 100, 200));
			fixture.detectChanges();
			(mockService.scrollNotify as EventEmitter<ScrollNotifyEvent>).emit({ rect: new Rect(0, 50, 1024, 300) });
			vi.runAllTimers();
			expect(component.loadCount).toBe(1);
		});

		it('should not emit when element is outside the scrolled viewport', () => {
			configure({ isBrowser: true, hasIntersectionObserver: false, currentViewport: offscreenViewport });
			vi.spyOn(Rect, 'fromElement').mockReturnValue(new Rect(0, 500, 100, 600));
			fixture.detectChanges();
			(mockService.scrollNotify as EventEmitter<ScrollNotifyEvent>).emit({ rect: new Rect(0, 0, 1024, 100) });
			vi.runAllTimers();
			expect(component.loadCount).toBe(0);
		});
	});

	describe('cleanup on destroy', () => {
		it('should unobserve on destroy when using IntersectionObserver', () => {
			configure({ isBrowser: true, hasIntersectionObserver: true });
			fixture.detectChanges();
			fixture.destroy();
			expect(mockService.unobserve).toHaveBeenCalled();
		});
	});
});
