import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { DialogComponent } from './dialog.component';
import { By } from '@angular/platform-browser';

describe('DialogComponent', () => {
	let component: DialogComponent;
	let fixture: ComponentFixture<DialogComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [DialogComponent, TranslateModule.forRoot()]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(DialogComponent);
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() => {
			fixture.detectChanges();
		});
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	describe('Input properties', () => {
		it('should accept title input', () => {
			const testTitle = 'Test Dialog Title';
			fixture.componentRef.setInput('title', testTitle);
			fixture.detectChanges();

			expect(component.title()).toBe(testTitle);
		});

		it('should accept className input', () => {
			const testClassName = 'test-class';
			fixture.componentRef.setInput('className', testClassName);
			fixture.detectChanges();

			expect(component.className()).toBe(testClassName);
		});

		it('should have default value for noClose input', () => {
			expect(component.noClose()).toBe(false);
		});

		it('should accept noClose input override', () => {
			fixture.componentRef.setInput('noClose', true);
			fixture.detectChanges();

			expect(component.noClose()).toBe(true);
		});
	});

	describe('Visible model property', () => {
		it('should have default value of false', () => {
			expect(component.visible()).toBe(false);
		});

		it('should be settable', () => {
			component.visible.set(true);
			fixture.detectChanges();

			expect(component.visible()).toBe(true);
		});
	});

	describe('Toggle method', () => {
		it('should toggle visible state from false to true', () => {
			component.visible.set(false);
			fixture.detectChanges();

			component.toggle();

			expect(component.visible()).toBe(true);
		});

		it('should toggle visible state from true to false', () => {
			component.visible.set(true);
			fixture.detectChanges();

			component.toggle();

			expect(component.visible()).toBe(false);
		});

		it('should emit clickEvent with new visible state', () => {
			const clickSpy = jest.spyOn(component.clickEvent, 'emit');
			component.visible.set(false);
			fixture.detectChanges();

			component.toggle();

			expect(clickSpy).toHaveBeenCalledWith(true);
		});
	});

	describe('Component rendering', () => {
		it('should not render dialog when visible is false', () => {
			component.visible.set(false);
			fixture.detectChanges();

			const overlayElement = fixture.debugElement.query(By.css('.overlay'));
			expect(overlayElement).toBeFalsy();
		});

		it('should render dialog when visible is true', () => {
			component.visible.set(true);
			fixture.detectChanges();

			const overlayElement = fixture.debugElement.query(By.css('.overlay'));
			expect(overlayElement).toBeTruthy();
		});

		it('should apply className to overlay element', () => {
			const testClassName = 'test-class';
			fixture.componentRef.setInput('className', testClassName);
			component.visible.set(true);
			fixture.detectChanges();

			const overlayElement = fixture.debugElement.query(By.css(`.overlay.${testClassName}`));
			expect(overlayElement).toBeTruthy();
		});

		it('should render title when provided', () => {
			const testTitle = 'Test Dialog Title';
			fixture.componentRef.setInput('title', testTitle);
			component.visible.set(true);
			fixture.detectChanges();

			const titleElement = fixture.debugElement.query(By.css('h1'));
			expect(titleElement).toBeTruthy();
			expect(titleElement.nativeElement.textContent).toContain(testTitle);
		});

		it('should not render title when not provided', () => {
			fixture.componentRef.setInput('title', undefined);
			component.visible.set(true);
			fixture.detectChanges();

			const titleElement = fixture.debugElement.query(By.css('h1'));
			expect(titleElement).toBeFalsy();
		});

		it('should render close button by default', () => {
			component.visible.set(true);
			fixture.detectChanges();

			const closeButton = fixture.debugElement.query(By.css('.close'));
			expect(closeButton).toBeTruthy();
		});

		it('should not render close button when noClose is true', () => {
			fixture.componentRef.setInput('noClose', true);
			component.visible.set(true);
			fixture.detectChanges();

			const closeButton = fixture.debugElement.query(By.css('.close'));
			expect(closeButton).toBeFalsy();
		});
	});

	describe('User interactions', () => {
		it('should close dialog when overlay is clicked', () => {
			component.visible.set(true);
			fixture.detectChanges();

			const overlayElement = fixture.debugElement.query(By.css('.overlay'));
			overlayElement.triggerEventHandler('click', {});
			fixture.detectChanges();

			expect(component.visible()).toBe(false);
		});

		it('should close dialog when close button is clicked', () => {
			component.visible.set(true);
			fixture.detectChanges();

			const closeButton = fixture.debugElement.query(By.css('.close'));
			closeButton.triggerEventHandler('click', {});
			fixture.detectChanges();

			expect(component.visible()).toBe(false);
		});

		it('should emit clickEvent when dialog is closed via overlay click', () => {
			const clickSpy = jest.spyOn(component.clickEvent, 'emit');
			component.visible.set(true);
			fixture.detectChanges();

			const overlayElement = fixture.debugElement.query(By.css('.overlay'));
			overlayElement.triggerEventHandler('click', {});

			expect(clickSpy).toHaveBeenCalledWith(false);
		});

		it('should emit clickEvent when dialog is closed via close button click', () => {
			const clickSpy = jest.spyOn(component.clickEvent, 'emit');
			component.visible.set(true);
			fixture.detectChanges();

			const closeButton = fixture.debugElement.query(By.css('.close'));
			closeButton.triggerEventHandler('click', {});

			expect(clickSpy).toHaveBeenCalledWith(false);
		});

		it('should stop event propagation when clicking on popup content', () => {
			component.visible.set(true);
			fixture.detectChanges();

			const popupElement = fixture.debugElement.query(By.css('.overlay-popup'));
			const stopPropagationSpy = jest.fn();
			popupElement.triggerEventHandler('click', { stopPropagation: stopPropagationSpy });

			expect(stopPropagationSpy).toHaveBeenCalled();
		});
	});
});
