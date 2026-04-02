import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferLoadScrollHostDirective } from './defer-load-scroll-host.directive';
import { DeferLoadService } from './defer-load.service';

@Component({
	template: `<div appDeferLoadScrollHost [scrollTo]="scrollTarget" style="overflow:auto;height:200px"></div>`,
	imports: [DeferLoadScrollHostDirective]
})
class TestHostComponent {
	scrollTarget: HTMLElement | undefined;
}

describe('DeferLoadScrollHostDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let component: TestHostComponent;
	let mockService: { notifyScroll: jest.Mock };

	beforeEach(() => {
		mockService = { notifyScroll: jest.fn() };
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

	describe('scrollTrack', () => {
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
	});

	describe('ngOnChanges', () => {
		it('should scroll to target element when scrollTo input changes', () => {
			const target = document.createElement('div');
			target.id = 'target-element';
			Object.defineProperty(target, 'offsetTop', { value: 300, configurable: true });
			Object.defineProperty(target, 'offsetHeight', { value: 50, configurable: true });
			document.body.append(target);

			const hostElement = fixture.nativeElement.querySelector('div');

			component.scrollTarget = target;
			fixture.detectChanges();

			expect(hostElement.scrollTop).toBe(300 - 50); // offsetTop - offsetHeight

			target.remove();
		});

		it('should not scroll when scrollTo input is undefined', () => {
			const hostElement = fixture.nativeElement.querySelector('div');
			component.scrollTarget = undefined;
			fixture.detectChanges();
			expect(hostElement.scrollTop).toBe(0);
		});

		it('should not scroll when scrollTo element has no id', () => {
			const target = document.createElement('div');
			// no id set
			const hostElement = fixture.nativeElement.querySelector('div');
			component.scrollTarget = target;
			fixture.detectChanges();
			expect(hostElement.scrollTop).toBe(0);
		});
	});
});
