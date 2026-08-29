import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferLoadScrollHostDirective } from './defer-load-scroll-host.directive';
import { DeferLoadService } from './defer-load.service';
import { type Mock, describe, beforeEach, it, expect, vi } from 'vitest';

@Component({
	template: `
		<div appDeferLoadScrollHost style="overflow:auto;height:200px"></div>`,
	imports: [DeferLoadScrollHostDirective]
})
class TestHostComponent {
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
});
