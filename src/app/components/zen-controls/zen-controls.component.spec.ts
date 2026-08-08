import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { GAME_MODE_EASY, GAME_MODE_EXPERT } from '../../model/consts';
import { ZenControlsComponent } from './zen-controls.component';

const toolbarDefaultRect: DOMRect = {
	x: 20, y: 30, left: 20, top: 30, right: 220, bottom: 90, width: 200, height: 60,
	toJSON: () => ({})
};

describe('ZenControlsComponent', () => {
	let component: ZenControlsComponent;
	let fixture: ComponentFixture<ZenControlsComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ZenControlsComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ZenControlsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('gameMode', GAME_MODE_EASY);
		fixture.detectChanges();
	});

	function getHandle(): HTMLElement {
		return fixture.nativeElement.querySelector('.drag-handle') as HTMLElement;
	}

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should show undo and hint buttons only in standard modes', () => {
		expect(fixture.nativeElement.querySelectorAll('.button')).toHaveLength(4); // pause, undo, hint, exit

		fixture.componentRef.setInput('gameMode', GAME_MODE_EXPERT);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelectorAll('.button')).toHaveLength(2); // pause, exit
	});

	it('should start dragging when pointer down on drag handle', () => {
		const handle = getHandle();
		const setPointerCaptureSpy = vi.fn();
		Object.defineProperty(handle, 'setPointerCapture', { value: setPointerCaptureSpy, configurable: true });
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue(toolbarDefaultRect);

		component.startDrag({
			currentTarget: handle,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
			preventDefault: vi.fn()
		});

		expect(setPointerCaptureSpy).toHaveBeenCalledWith(1);
		expect(component.translateX()).toBe(0);
		expect(component.translateY()).toBe(0);
	});

	it('should update and clamp the position while dragging', () => {
		const handle = getHandle();
		Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn(), configurable: true });
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue(toolbarDefaultRect);

		component.startDrag({
			currentTarget: handle,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
			preventDefault: vi.fn()
		});

		component.onDrag({
			clientX: 2000,
			clientY: 2000,
			pointerId: 1,
			preventDefault: vi.fn()
		});

		expect(component.translateX()).toBe(window.innerWidth - 228);
		expect(component.translateY()).toBe(window.innerHeight - 98);
	});

	it('should stop dragging on pointer up', () => {
		const handle = getHandle();
		Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn(), configurable: true });
		const releasePointerCaptureSpy = vi.fn();
		Object.defineProperty(handle, 'releasePointerCapture', { value: releasePointerCaptureSpy, configurable: true });
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue(toolbarDefaultRect);

		component.startDrag({
			currentTarget: handle,
			clientX: 100,
			clientY: 100,
			pointerId: 5,
			preventDefault: vi.fn()
		});

		component.stopDrag();

		expect(releasePointerCaptureSpy).toHaveBeenCalledWith(5);
	});

	function startDragWithPointer(pointerId: number): { releasePointerCapture: ReturnType<typeof vi.fn> } {
		const handle = getHandle();
		Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn(), configurable: true });
		const releasePointerCapture = vi.fn();
		Object.defineProperty(handle, 'releasePointerCapture', { value: releasePointerCapture, configurable: true });
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue(toolbarDefaultRect);

		component.startDrag({
			currentTarget: handle,
			clientX: 100,
			clientY: 100,
			pointerId,
			preventDefault: vi.fn()
		});
		return { releasePointerCapture };
	}

	it('should end the drag when the dragging pointer is released', () => {
		const { releasePointerCapture } = startDragWithPointer(5);

		component.onDragEnd({ pointerId: 5 });

		expect(releasePointerCapture).toHaveBeenCalledWith(5);
	});

	it('should ignore a release from a pointer that is not dragging', () => {
		const { releasePointerCapture } = startDragWithPointer(5);

		// a second finger touches down elsewhere and lifts again mid-drag
		component.onDragEnd({ pointerId: 9 });

		expect(releasePointerCapture).not.toHaveBeenCalled();

		// the drag is still live and keeps following the original pointer
		component.onDrag({ clientX: 140, clientY: 130, pointerId: 5, preventDefault: vi.fn() });
		expect(component.translateX()).toBe(40);
		expect(component.translateY()).toBe(30);
	});

	it('should ignore movement from a pointer that is not dragging', () => {
		startDragWithPointer(5);

		const preventDefault = vi.fn();
		component.onDrag({ clientX: 400, clientY: 400, pointerId: 9, preventDefault });

		expect(preventDefault).not.toHaveBeenCalled();
		expect(component.translateX()).toBe(0);
		expect(component.translateY()).toBe(0);

		// the original pointer still drives the panel
		component.onDrag({ clientX: 140, clientY: 130, pointerId: 5, preventDefault: vi.fn() });
		expect(component.translateX()).toBe(40);
		expect(component.translateY()).toBe(30);
	});

	it('should ignore movement when no drag is in progress', () => {
		const preventDefault = vi.fn();
		component.onDrag({ clientX: 400, clientY: 400, pointerId: 1, preventDefault });

		expect(preventDefault).not.toHaveBeenCalled();
		expect(component.translateX()).toBe(0);
		expect(component.translateY()).toBe(0);
	});

	it('should move with ArrowRight on drag handle', () => {
		const handle = getHandle();
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue(toolbarDefaultRect);
		const event = {
			key: 'ArrowRight',
			currentTarget: handle,
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent;

		component.onHandleKeyDown(event);

		expect(component.translateX()).toBe(16);
		expect(component.translateY()).toBe(0);
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('should clamp keyboard movement inside viewport', () => {
		const handle = getHandle();
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
			x: window.innerWidth - 208,
			y: window.innerHeight - 68,
			left: window.innerWidth - 208,
			top: window.innerHeight - 68,
			right: window.innerWidth - 8,
			bottom: window.innerHeight - 8,
			width: 200,
			height: 60,
			toJSON: () => ({})
		});

		component.onHandleKeyDown({
			key: 'ArrowRight',
			currentTarget: handle,
			preventDefault: vi.fn()
		});

		expect(component.translateX()).toBe(0);
		expect(component.translateY()).toBe(0);
	});
});
