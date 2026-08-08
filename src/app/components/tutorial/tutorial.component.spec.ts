import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { SvgdefService } from '../../service/svgdef.service';
import { AppService } from '../../service/app.service';
import { createTutorialBoard, TUTORIAL_STEPS } from '../../model/tutorial';
import { TutorialComponent } from './tutorial.component';

// clicks matching pairs until the board is empty, which is what triggers the auto-advance
function clearBoard(component: TutorialComponent): void {
	const board = component.board();
	while (board.count() > 0) {
		const free = board.stones().filter(stone => !stone.picked() && !stone.state().blocked);
		const first = free.find(stone => free.some(other => other !== stone && other.groupNr === stone.groupNr));
		const second = first && free.find(other => other !== first && other.groupNr === first.groupNr);
		if (!first || !second) {
			throw new Error('board cannot be cleared');
		}
		component.onStoneClick(first);
		component.onStoneClick(second);
	}
}

describe('TutorialComponent', () => {
	let component: TutorialComponent;
	let fixture: ComponentFixture<TutorialComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [TutorialComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), SvgdefService, AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TutorialComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should start at the welcome step (index -1) and build a board', () => {
		expect(component.currentStepIndex()).toBe(-1);
		expect(component.board()).toBeTruthy();
	});

	describe('Welcome screen', () => {
		it('should render the welcome screen when at step -1', () => {
			const welcome = fixture.debugElement.query(By.css('.tutorial-welcome'));
			expect(welcome).toBeTruthy();
		});

		it('should move to the first step and rebuild the board on start()', () => {
			const previousBoard = component.board();
			component.start();
			fixture.detectChanges();

			expect(component.currentStepIndex()).toBe(0);
			expect(component.board()).not.toBe(previousBoard);
			expect(fixture.debugElement.query(By.css('.tutorial-main'))).toBeTruthy();
		});
	});

	describe('Step navigation', () => {
		it('should advance to the next step and rebuild the board on next()', () => {
			component.start();
			fixture.detectChanges();
			const previousBoard = component.board();

			component.next();
			fixture.detectChanges();

			expect(component.currentStepIndex()).toBe(1);
			expect(component.board()).not.toBe(previousBoard);
		});

		it('should expose the current step matching the index', () => {
			component.start();
			expect(component.currentStep()).toBe(TUTORIAL_STEPS[0]);
		});

		it('should render the complete screen after the last step', () => {
			component.currentStepIndex.set(TUTORIAL_STEPS.length);
			fixture.detectChanges();

			expect(fixture.debugElement.query(By.css('.tutorial-complete'))).toBeTruthy();
		});

		// unclamped, the index ran past steps.length into the step branch and read
		// titleKey off an undefined step
		it('should not advance past the complete screen', () => {
			component.currentStepIndex.set(TUTORIAL_STEPS.length);

			component.next();
			fixture.detectChanges();

			expect(component.currentStepIndex()).toBe(TUTORIAL_STEPS.length);
			expect(fixture.debugElement.query(By.css('.tutorial-complete'))).toBeTruthy();
		});
	});

	describe('Auto-advance after clearing a board', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should advance one step when the board is cleared', () => {
			component.start();

			clearBoard(component);
			vi.advanceTimersByTime(50);

			expect(component.currentStepIndex()).toBe(1);
		});

		// pressing Next inside the 10 ms window used to consume the step twice
		it('should cancel the pending advance when the next button is pressed', () => {
			component.start();

			clearBoard(component);
			component.next();
			vi.advanceTimersByTime(50);

			expect(component.currentStepIndex()).toBe(1);
		});

		it('should stay on the complete screen when the last board clears and next is pressed', () => {
			component.currentStepIndex.set(TUTORIAL_STEPS.length - 1);
			component.board.set(createTutorialBoard(TUTORIAL_STEPS[0].board));

			clearBoard(component);
			component.next();
			vi.advanceTimersByTime(50);
			fixture.detectChanges();

			expect(component.currentStepIndex()).toBe(TUTORIAL_STEPS.length);
			expect(fixture.debugElement.query(By.css('.tutorial-complete'))).toBeTruthy();
		});
	});

	describe('Completion', () => {
		it('should emit completed on skip()', () => {
			const spy = vi.fn();
			component.completed.subscribe(spy);

			component.skip();

			expect(spy).toHaveBeenCalled();
		});
	});

	describe('Selection', () => {
		it('should clear the board selection when clicking empty space', () => {
			component.start();
			fixture.detectChanges();
			const stone = component.board().stones()[0];
			component.board().setStoneSelected(stone);
			expect(component.board().selected).toBe(stone);

			component.onStoneClick(undefined);

			expect(component.board().selected).toBeUndefined();
		});
	});
});
