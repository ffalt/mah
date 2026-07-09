import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Indicator } from '../../model/indicator';
import { GestureIndicatorsComponent } from './gesture-indicators.component';

describe('GestureIndicatorsComponent', () => {
	let component: GestureIndicatorsComponent;
	let fixture: ComponentFixture<GestureIndicatorsComponent>;
	let indicators: Indicator;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [GestureIndicatorsComponent]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GestureIndicatorsComponent);
		component = fixture.componentInstance;
		indicators = new Indicator();
		fixture.componentRef.setInput('indicators', indicators);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render displayed indicators and reflect their visibility state', () => {
		vi.useFakeTimers();
		try {
			indicators.display(100, 100, 30);
			fixture.detectChanges();

			const element = fixture.nativeElement.querySelector(':scope .gesture-indicator') as HTMLElement;
			expect(element).toBeTruthy();
			expect(element.classList.contains('visible')).toBe(false);

			vi.advanceTimersByTime(100);
			fixture.detectChanges();
			expect(element.classList.contains('visible')).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('should update the rendered size when the indicator is resized', () => {
		vi.useFakeTimers();
		try {
			indicators.display(100, 100, 30);
			fixture.detectChanges();

			indicators.setSize(0, 60);
			fixture.detectChanges();

			const element = fixture.nativeElement.querySelector(':scope .gesture-indicator') as HTMLElement;
			expect(element.style.width).toBe('60px');
			expect(element.style.top).toBe('70px'); // y - size / 2
		} finally {
			vi.useRealTimers();
		}
	});
});
