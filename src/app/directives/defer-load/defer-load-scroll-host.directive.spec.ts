import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferLoadScrollHostDirective } from './defer-load-scroll-host.directive';
import { DeferLoadService } from './defer-load.service';
import { Mock, describe, beforeEach, it, expect, vi } from 'vitest';

@Component({
	template: `
		<div appDeferLoadScrollHost [scrollTo]="scrollTarget()" style="overflow:auto;height:200px"></div>`,
	imports: [DeferLoadScrollHostDirective]
})
class TestHostComponent {
	readonly scrollTarget = signal<HTMLElement | undefined>(undefined);
}

describe('DeferLoadScrollHostDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let component: TestHostComponent;
	let mockService: { notifyScroll: Mock; hasIntersectionObserver: boolean };

	beforeEach(() => {
		mockService = { notifyScroll: vi.fn(), hasIntersectionObserver: false };
		TestBed.configureTestingModule({
			imports: [TestHostComponent],
			providers: [{ provide: DeferLoadService, useValue: mockService }]
		});
		fixture = TestBed.createComponent(TestHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('scroll notification', () => {
		it('should notify the service when the host element scrolls', () => {
			const hostElement = fixture.nativeElement.querySelector('div');
			hostElement.dispatchEvent(new Event('scroll'));
			expect(mockService.notifyScroll).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'scroll-host', element: hostElement })
			);
		});

		it('should pass the host element to notifyScroll', () => {
			const hostElement = fixture.nativeElement.querySelector('div');
			hostElement.dispatchEvent(new Event('scroll'));
			const callArgument = mockService.notifyScroll.mock.calls[0][0];
			expect(callArgument.element).toBe(hostElement);
		});

		it('should not listen for scroll events when IntersectionObserver is available', () => {
			mockService.hasIntersectionObserver = true;
			const observerFixture = TestBed.createComponent(TestHostComponent);
			observerFixture.detectChanges();

			const hostElement = observerFixture.nativeElement.querySelector('div');
			hostElement.dispatchEvent(new Event('scroll'));
			expect(mockService.notifyScroll).not.toHaveBeenCalled();
		});
	});

	describe('ngOnChanges', () => {
		it('should scroll to target element when scrollTo input changes', () => {
			const target = document.createElement('div');
			target.id = 'target-element';
			Object.defineProperties(target, {
				offsetTop: { value: 300, configurable: true },
				offsetHeight: { value: 50, configurable: true }
			});
			document.body.append(target);

			const hostElement = fixture.nativeElement.querySelector('div');
			let capturedScrollTop = 0;
			Object.defineProperty(hostElement, 'scrollTop', {
				set: (value: number) => {
					capturedScrollTop = value;
				},
				get: () => capturedScrollTop,
				configurable: true
			});

			component.scrollTarget.set(target);
			fixture.detectChanges();

			expect(capturedScrollTop).toBe(300 - 50); // offsetTop - offsetHeight

			target.remove();
		});

		it('should not scroll when scrollTo input is undefined', () => {
			const hostElement = fixture.nativeElement.querySelector('div');
			component.scrollTarget.set(undefined);
			fixture.detectChanges();
			expect(hostElement.scrollTop).toBe(0);
		});

		it('should not scroll when scrollTo element has no id', () => {
			const target = document.createElement('div');
			// no id set
			const hostElement = fixture.nativeElement.querySelector('div');
			component.scrollTarget.set(target);
			fixture.detectChanges();
			expect(hostElement.scrollTop).toBe(0);
		});
	});
});
