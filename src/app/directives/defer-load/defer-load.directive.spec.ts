import { Component, EventEmitter } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferLoadDirective } from './defer-load.directive';
import { DeferLoadService, type ScrollNotifyEvent } from './defer-load.service';
import { Rect } from './rect';

@Component({
	template: `<div appDeferLoad (appDeferLoad)="onLoad()" [preRender]="preRender"></div>`,
	imports: [DeferLoadDirective]
})
class TestHostComponent {
	preRender = false;
	loadCount = 0;
	onLoad(): void {
		this.loadCount++;
	}
}

const mockObserver = {
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn()
};

function makeMockService(overrides: Partial<DeferLoadService> = {}): Partial<DeferLoadService> {
	return {
		isBrowser: false,
		hasIntersectionObserver: false,
		observeNotify: new EventEmitter<Array<IntersectionObserverEntry>>(),
		scrollNotify: new EventEmitter<ScrollNotifyEvent>(),
		currentViewport: new Rect(0, 0, 1024, 768),
		getObserver: jest.fn().mockReturnValue(mockObserver),
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
		jest.useFakeTimers();
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
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
			jest.runAllTimers();
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

		it('should register element with the intersection observer', () => {
			fixture.detectChanges();
			expect(mockObserver.observe).toHaveBeenCalled();
		});

		it('should emit after 20ms delay when element is intersecting', () => {
			fixture.detectChanges();
			const target = fixture.nativeElement.querySelector('div');
			const entries = [{ time: 1, isIntersecting: true, target }] as unknown as Array<IntersectionObserverEntry>;
			(mockService.observeNotify as EventEmitter<Array<IntersectionObserverEntry>>).emit(entries);
			expect(component.loadCount).toBe(0);
			jest.advanceTimersByTime(20);
			expect(component.loadCount).toBe(1);
		});

		it('should not emit when entry is for a different element', () => {
			fixture.detectChanges();
			const entries = [{ time: 1, isIntersecting: true, target: document.createElement('div') }] as unknown as Array<IntersectionObserverEntry>;
			(mockService.observeNotify as EventEmitter<Array<IntersectionObserverEntry>>).emit(entries);
			jest.advanceTimersByTime(20);
			expect(component.loadCount).toBe(0);
		});

		it('should cancel load if element leaves viewport before delay elapses', () => {
			fixture.detectChanges();
			const target = fixture.nativeElement.querySelector('div');
			// Enter viewport
			(mockService.observeNotify as EventEmitter<Array<IntersectionObserverEntry>>).emit(
				[{ time: 1, isIntersecting: true, target }] as unknown as Array<IntersectionObserverEntry>
			);
			// Leave before 20ms
			(mockService.observeNotify as EventEmitter<Array<IntersectionObserverEntry>>).emit(
				[{ time: 2, isIntersecting: false, target }] as unknown as Array<IntersectionObserverEntry>
			);
			jest.advanceTimersByTime(20);
			expect(component.loadCount).toBe(0);
		});

		it('should unobserve element after loading', () => {
			fixture.detectChanges();
			const target = fixture.nativeElement.querySelector('div');
			(mockService.observeNotify as EventEmitter<Array<IntersectionObserverEntry>>).emit(
				[{ time: 1, isIntersecting: true, target }] as unknown as Array<IntersectionObserverEntry>
			);
			jest.advanceTimersByTime(20);
			expect(mockObserver.unobserve).toHaveBeenCalled();
		});
	});

	describe('scroll listener path', () => {
		// Use a currentViewport that does not intersect the test element so the
		// initial on-init check in addScrollListeners does not trigger a load.
		const offscreenViewport = new Rect(0, -500, 1024, -1);

		it('should emit when the element is in the scrolled viewport', () => {
			configure({ isBrowser: true, hasIntersectionObserver: false, currentViewport: offscreenViewport });
			jest.spyOn(Rect, 'fromElement').mockReturnValue(new Rect(0, 100, 100, 200));
			fixture.detectChanges();
			(mockService.scrollNotify as EventEmitter<ScrollNotifyEvent>).emit({ rect: new Rect(0, 50, 1024, 300) });
			jest.runAllTimers();
			expect(component.loadCount).toBe(1);
		});

		it('should not emit when element is outside the scrolled viewport', () => {
			configure({ isBrowser: true, hasIntersectionObserver: false, currentViewport: offscreenViewport });
			jest.spyOn(Rect, 'fromElement').mockReturnValue(new Rect(0, 500, 100, 600));
			fixture.detectChanges();
			(mockService.scrollNotify as EventEmitter<ScrollNotifyEvent>).emit({ rect: new Rect(0, 0, 1024, 100) });
			jest.runAllTimers();
			expect(component.loadCount).toBe(0);
		});
	});

	describe('cleanup on destroy', () => {
		it('should unobserve on destroy when using IntersectionObserver', () => {
			configure({ isBrowser: true, hasIntersectionObserver: true });
			fixture.detectChanges();
			fixture.destroy();
			expect(mockObserver.unobserve).toHaveBeenCalled();
		});
	});
});
