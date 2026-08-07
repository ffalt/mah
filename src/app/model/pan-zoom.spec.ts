import { describe, it, expect, beforeEach, afterEach, type Mock, vi } from 'vitest';
import { PanZoom, ZOOM_STEP } from './pan-zoom';
import { Indicator } from './indicator';

const WIDTH = 800;
const HEIGHT = 600;
// setPanValue allows this much slack past the scaled bounds
const MARGIN = 50;

function touch(x: number, y: number, identifier = 0): Touch {
	return { clientX: x, clientY: y, identifier } as Touch;
}

function touchEvent(touches: Array<Touch>, changed: Array<Touch> = []): TouchEvent {
	return {
		preventDefault: vi.fn(),
		touches: touches as unknown as TouchList,
		changedTouches: changed as unknown as TouchList
	} as unknown as TouchEvent;
}

function mouseEvent(x: number, y: number, type = 'mousemove'): MouseEvent {
	return { clientX: x, clientY: y, type, preventDefault: vi.fn() } as unknown as MouseEvent;
}

function wheelEvent(deltaY: number, x = 400, y = 300): WheelEvent {
	return { deltaY, clientX: x, clientY: y, preventDefault: vi.fn() } as unknown as WheelEvent;
}

describe('PanZoom', () => {
	let indicators: Indicator;
	let onTransformChange: Mock<() => void>;
	let panZoom: PanZoom;

	// the transform is applied inside a frame callback, so run it straight away to keep assertions ordered
	beforeEach(() => {
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			callback(0);
			return 0;
		});
		indicators = new Indicator();
		onTransformChange = vi.fn<() => void>();
		panZoom = new PanZoom(() => ({ width: WIDTH, height: HEIGHT }), indicators, onTransformChange);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function zoomTo(scale: number): void {
		panZoom.zoomSVGValue(scale, WIDTH / 2, HEIGHT / 2);
		// zooming is anchored on that point and so leaves a pan behind - start the pan assertions from the origin
		panZoom.panX = 0;
		panZoom.panY = 0;
		onTransformChange.mockClear();
	}

	describe('reset', () => {
		it('drops the scale and the pan back to the start', () => {
			zoomTo(2);
			panZoom.setPanValue(-100, -100);

			panZoom.reset();

			expect(panZoom.scale).toBe(1);
			expect(panZoom.panX).toBe(0);
			expect(panZoom.panY).toBe(0);
			expect(onTransformChange).toHaveBeenCalled();
		});

		it('drops a pinch in progress instead of applying it on the next touch end', () => {
			zoomTo(2);
			panZoom.onTouchStart(touchEvent([touch(300, 300, 0), touch(500, 300, 1)]));

			panZoom.reset();

			expect(panZoom.isPinching).toBe(false);
			expect(panZoom.initialDistance).toBe(0);
			expect(indicators.gestureIndicators()).toHaveLength(0);

			panZoom.onTouchEnd(touchEvent([], [touch(200, 300, 0), touch(600, 300, 1)]));
			expect(panZoom.scale).toBe(1);
		});

		it('drops a pan in progress and clears the tap-swallowing flags', () => {
			zoomTo(2);
			panZoom.onTouchStart(touchEvent([touch(300, 300, 0)]));
			panZoom.hasTouchPanMoved = true;
			panZoom.hasPinchChanged = true;

			panZoom.reset();

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.hasTouchPanMoved).toBe(false);
			expect(panZoom.hasPinchChanged).toBe(false);
			expect(panZoom.touchPoints).toHaveLength(0);
		});
	});

	describe('clampPan', () => {
		it('keeps the scale and a pan that is still in bounds', () => {
			zoomTo(2);
			panZoom.setPanValue(-100, -100);

			panZoom.clampPan();

			expect(panZoom.scale).toBe(2);
			expect(panZoom.panX).toBe(-100);
			expect(panZoom.panY).toBe(-100);
			expect(onTransformChange).toHaveBeenCalled();
		});

		it('pulls a pan that fell out of bounds back in', () => {
			zoomTo(2);
			panZoom.panX = -5000;
			panZoom.panY = -5000;

			panZoom.clampPan();

			expect(panZoom.panX).toBe(-WIDTH - MARGIN);
			expect(panZoom.panY).toBe(-HEIGHT - MARGIN);
		});
	});

	describe('syncTransformSVG', () => {
		it('leaves the scale out of the transform while it is 1', () => {
			panZoom.syncTransformSVG();
			expect(panZoom.transformSVG).toBe('translate(0px, 0px)');
		});

		it('includes the scale once zoomed', () => {
			panZoom.scale = 1.5;
			panZoom.panX = 10;
			panZoom.panY = -20;

			panZoom.syncTransformSVG();

			expect(panZoom.transformSVG).toBe('translate(10px, -20px) scale(1.5)');
		});
	});

	describe('updateTransform', () => {
		it('syncs the transform and reports the change', () => {
			panZoom.scale = 2;
			panZoom.updateTransform();

			expect(panZoom.transformSVG).toBe('translate(0px, 0px) scale(2)');
			expect(onTransformChange).toHaveBeenCalledTimes(1);
		});
	});

	describe('zoomSVGValue', () => {
		it('clamps above the maximum', () => {
			panZoom.zoomSVGValue(9, 400, 300);
			expect(panZoom.scale).toBe(2);
		});

		it('does nothing when the scale would not change', () => {
			panZoom.zoomSVGValue(1, 400, 300);

			expect(panZoom.scale).toBe(1);
			expect(onTransformChange).not.toHaveBeenCalled();
		});

		it('snaps back to 1 and clears the pan just above the minimum', () => {
			zoomTo(2);
			panZoom.setPanValue(-100, -100);

			panZoom.zoomSVGValue(1.005, 400, 300);

			expect(panZoom.scale).toBe(1);
			expect(panZoom.panX).toBe(0);
			expect(panZoom.panY).toBe(0);
		});

		it('keeps the zoom anchored on the given point', () => {
			panZoom.zoomSVGValue(2, 100, 100);

			expect(panZoom.scale).toBe(2);
			// the anchor has to land back on itself: 100 * 2 - 100 === 100
			expect(100 * panZoom.scale + panZoom.panX).toBe(100);
			expect(100 * panZoom.scale + panZoom.panY).toBe(100);
		});
	});

	describe('setPanValue', () => {
		it('allows only the margin while the board is not zoomed', () => {
			panZoom.setPanValue(500, 500);
			expect(panZoom.panX).toBe(MARGIN);
			expect(panZoom.panY).toBe(MARGIN);

			panZoom.setPanValue(-500, -500);
			expect(panZoom.panX).toBe(-MARGIN);
			expect(panZoom.panY).toBe(-MARGIN);
		});

		it('allows the extra scaled size once zoomed', () => {
			zoomTo(2);

			panZoom.setPanValue(-5000, -5000);

			expect(panZoom.panX).toBe(-WIDTH - MARGIN);
			expect(panZoom.panY).toBe(-HEIGHT - MARGIN);
		});

		it('falls back to the origin when the container has no size', () => {
			const unsized = new PanZoom(() => ({ width: 0, height: 0 }), indicators, onTransformChange);
			unsized.panX = 30;
			unsized.panY = 30;

			unsized.setPanValue(100, 100);

			expect(unsized.panX).toBe(0);
			expect(unsized.panY).toBe(0);
		});

		it('leaves an unsized container at the origin it is already on', () => {
			const unsized = new PanZoom(() => ({ width: 0, height: 0 }), indicators, onTransformChange);

			unsized.setPanValue(100, 100);

			expect(unsized.panX).toBe(0);
			expect(unsized.panY).toBe(0);
		});
	});

	describe('onWheel', () => {
		it('zooms in by one step when the wheel goes up', () => {
			const event = wheelEvent(-1);

			panZoom.onWheel(event);

			expect(panZoom.scale).toBe(1 + ZOOM_STEP);
			expect(event.preventDefault).toHaveBeenCalled();
		});

		it('zooms out by one step when the wheel goes down', () => {
			zoomTo(2);

			panZoom.onWheel(wheelEvent(1));

			expect(panZoom.scale).toBeCloseTo(2 - ZOOM_STEP, 10);
		});

		it('cannot zoom out below 1', () => {
			panZoom.onWheel(wheelEvent(1));
			expect(panZoom.scale).toBe(1);
		});

		it('shows an indicator where the wheel was used', () => {
			panZoom.onWheel(wheelEvent(-1, 120, 240));

			const indicator = indicators.gestureIndicators()[0];
			expect(indicator.x).toBe(120);
			expect(indicator.y).toBe(240);
		});
	});

	describe('onMouseDown', () => {
		it('ignores the press while the board is not zoomed', () => {
			const event = mouseEvent(100, 100, 'mousedown');

			panZoom.onMouseDown(event);

			expect(panZoom.initialMouseX).toBe(0);
			expect(event.preventDefault).not.toHaveBeenCalled();
		});

		it('records the press once zoomed', () => {
			zoomTo(2);
			const event = mouseEvent(100, 120, 'mousedown');

			panZoom.onMouseDown(event);

			expect(panZoom.initialMouseX).toBe(100);
			expect(panZoom.initialMouseY).toBe(120);
			expect(panZoom.lastMouseX).toBe(100);
			expect(panZoom.lastMouseY).toBe(120);
			expect(event.preventDefault).toHaveBeenCalled();
		});
	});

	describe('onMouseMove', () => {
		it('ignores the move while the board is not zoomed', () => {
			panZoom.onMouseMove(mouseEvent(200, 200));

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.panX).toBe(0);
		});

		it('waits for the drag threshold before it starts panning', () => {
			zoomTo(2);
			panZoom.onMouseDown(mouseEvent(100, 100, 'mousedown'));

			panZoom.onMouseMove(mouseEvent(105, 100));

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.panX).toBe(0);
		});

		it('pans once the drag passes the threshold', () => {
			zoomTo(2);
			panZoom.onMouseDown(mouseEvent(100, 100, 'mousedown'));
			const event = mouseEvent(120, 100);

			panZoom.onMouseMove(event);

			expect(panZoom.isPanning).toBe(true);
			expect(panZoom.panX).toBe(20);
			expect(event.preventDefault).toHaveBeenCalled();
		});

		it('keeps panning on every move after the first', () => {
			zoomTo(2);
			panZoom.onMouseDown(mouseEvent(100, 100, 'mousedown'));
			panZoom.onMouseMove(mouseEvent(120, 100));

			panZoom.onMouseMove(mouseEvent(125, 100));

			expect(panZoom.panX).toBe(25);
		});

		it('ignores a move that had no press before it', () => {
			zoomTo(2);

			panZoom.onMouseMove(mouseEvent(300, 300));

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.panX).toBe(0);
		});
	});

	describe('onMouseUp', () => {
		it('reports a click while the board is not zoomed', () => {
			expect(panZoom.onMouseUp(mouseEvent(100, 100, 'mouseup'))).toBe(true);
		});

		it('never reports a click when the pointer leaves the board', () => {
			expect(panZoom.onMouseUp(mouseEvent(100, 100, 'mouseleave'))).toBe(false);
		});

		it('reports a click on a zoomed board when the pointer barely moved', () => {
			zoomTo(2);
			panZoom.onMouseDown(mouseEvent(100, 100, 'mousedown'));

			expect(panZoom.onMouseUp(mouseEvent(102, 100, 'mouseup'))).toBe(true);
		});

		it('does not report a click when the pointer moved too far', () => {
			zoomTo(2);
			panZoom.onMouseDown(mouseEvent(100, 100, 'mousedown'));

			expect(panZoom.onMouseUp(mouseEvent(110, 100, 'mouseup'))).toBe(false);
		});

		it('does not report a click on a zoomed board that had no press before it', () => {
			zoomTo(2);

			expect(panZoom.onMouseUp(mouseEvent(100, 100, 'mouseup'))).toBe(false);
		});

		it('finishes a pan instead of reporting a click', () => {
			zoomTo(2);
			panZoom.onMouseDown(mouseEvent(100, 100, 'mousedown'));
			panZoom.onMouseMove(mouseEvent(120, 100));

			const clicked = panZoom.onMouseUp(mouseEvent(140, 100, 'mouseup'));

			expect(clicked).toBe(false);
			expect(panZoom.panX).toBe(40);
			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.initialMouseX).toBe(0);
		});
	});

	describe('updatePanning', () => {
		it('moves the board by the pointer delta and reports the change', () => {
			zoomTo(2);
			panZoom.lastMouseX = 100;
			panZoom.lastMouseY = 100;

			panZoom.updatePanning(mouseEvent(130, 90));

			expect(panZoom.panX).toBe(30);
			expect(panZoom.panY).toBe(-10);
			expect(panZoom.lastMouseX).toBe(130);
			expect(panZoom.lastMouseY).toBe(90);
			expect(onTransformChange).toHaveBeenCalled();
		});
	});

	describe('stopPanning', () => {
		it('clears the panning state', () => {
			panZoom.isPanning = true;
			panZoom.initialMouseX = 10;
			panZoom.initialMouseY = 10;

			panZoom.stopPanning();

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.initialMouseX).toBe(0);
			expect(panZoom.initialMouseY).toBe(0);
		});
	});

	describe('onTouchStart', () => {
		it('starts panning on one finger', () => {
			const event = touchEvent([touch(100, 100)]);

			panZoom.onTouchStart(event);

			expect(panZoom.isPanning).toBe(true);
			expect(panZoom.isPinching).toBe(false);
			expect(panZoom.lastTouchX).toBe(100);
			expect(panZoom.lastTouchY).toBe(100);
			expect(event.preventDefault).toHaveBeenCalled();
		});

		it('starts pinching on two fingers', () => {
			panZoom.onTouchStart(touchEvent([touch(100, 100, 0), touch(200, 100, 1)]));

			expect(panZoom.isPinching).toBe(true);
			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.initialDistance).toBe(100);
			expect(indicators.gestureIndicators()).toHaveLength(1);
			expect(indicators.gestureIndicators()[0].x).toBe(150);
		});

		it('does neither on three fingers', () => {
			panZoom.onTouchStart(touchEvent([touch(10, 10, 0), touch(20, 20, 1), touch(30, 30, 2)]));

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.isPinching).toBe(false);
		});

		it('clears the gesture flags left by the previous touch', () => {
			panZoom.hasTouchPanMoved = true;
			panZoom.hasPinchChanged = true;

			panZoom.onTouchStart(touchEvent([touch(100, 100)]));

			expect(panZoom.hasTouchPanMoved).toBe(false);
			expect(panZoom.hasPinchChanged).toBe(false);
		});
	});

	describe('onTouchMove while pinching', () => {
		beforeEach(() => {
			panZoom.onTouchStart(touchEvent([touch(100, 100, 0), touch(200, 100, 1)]));
		});

		it('flags a pinch once it passes the threshold', () => {
			panZoom.onTouchMove(touchEvent([touch(50, 100, 0), touch(250, 100, 1)]));

			expect(panZoom.hasPinchChanged).toBe(true);
		});

		it('leaves the flag alone for a pinch that barely moved', () => {
			panZoom.onTouchMove(touchEvent([touch(99, 100, 0), touch(201, 100, 1)]));

			expect(panZoom.hasPinchChanged).toBe(false);
		});

		it('follows the pinch with the indicator', () => {
			panZoom.onTouchMove(touchEvent([touch(100, 200, 0), touch(300, 200, 1)]));

			const indicator = indicators.gestureIndicators()[0];
			expect(indicator.x).toBe(200);
			expect(indicator.y).toBe(200);
			// twice the distance, so twice the size
			expect(indicator.size).toBe(60);
		});

		it('caps the indicator size', () => {
			panZoom.onTouchMove(touchEvent([touch(0, 100, 0), touch(2000, 100, 1)]));

			expect(indicators.gestureIndicators()[0].size).toBe(80);
		});

		it('creates an indicator when the pinch has none', () => {
			indicators.gestureIndicators.set([]);

			panZoom.onTouchMove(touchEvent([touch(100, 100, 0), touch(300, 100, 1)]));

			expect(indicators.gestureIndicators()).toHaveLength(1);
		});

		it('does not pan while two fingers are down', () => {
			panZoom.onTouchMove(touchEvent([touch(150, 150, 0), touch(250, 150, 1)]));

			expect(panZoom.panX).toBe(0);
		});
	});

	describe('onTouchMove while panning', () => {
		beforeEach(() => {
			zoomTo(2);
			panZoom.onTouchStart(touchEvent([touch(100, 100)]));
			// the pan is gated for a moment after a pinch, so put the last one well in the past
			panZoom.lastPinch = Date.now() - 1000;
		});

		it('moves the board with the finger', () => {
			panZoom.onTouchMove(touchEvent([touch(130, 80)]));

			expect(panZoom.panX).toBe(30);
			expect(panZoom.panY).toBe(-20);
		});

		it('flags the pan once it passes the threshold', () => {
			panZoom.onTouchMove(touchEvent([touch(130, 100)]));

			expect(panZoom.hasTouchPanMoved).toBe(true);
		});

		it('leaves the flag alone for a finger that barely moved', () => {
			panZoom.onTouchMove(touchEvent([touch(105, 100)]));

			expect(panZoom.hasTouchPanMoved).toBe(false);
		});

		it('does not pan straight after a pinch', () => {
			panZoom.lastPinch = Date.now();

			panZoom.onTouchMove(touchEvent([touch(130, 100)]));

			expect(panZoom.panX).toBe(0);
		});

		it('does not pan while the board is not zoomed', () => {
			panZoom.reset();

			panZoom.onTouchMove(touchEvent([touch(130, 100)]));

			expect(panZoom.panX).toBe(0);
		});
	});

	describe('onTouchEnd after a pinch', () => {
		beforeEach(() => {
			// 100px apart
			panZoom.onTouchStart(touchEvent([touch(100, 100, 0), touch(200, 100, 1)]));
		});

		it('zooms in on a pinch out', () => {
			panZoom.onTouchEnd(touchEvent([], [touch(50, 100, 0), touch(250, 100, 1)]));

			expect(panZoom.scale).toBe(2);
			expect(panZoom.isPinching).toBe(false);
		});

		it('zooms out on a pinch in', () => {
			zoomTo(2);
			panZoom.onTouchStart(touchEvent([touch(100, 100, 0), touch(300, 100, 1)]));

			panZoom.onTouchEnd(touchEvent([], [touch(150, 100, 0), touch(250, 100, 1)]));

			expect(panZoom.scale).toBe(1);
		});

		it('leaves the scale alone when the fingers barely moved', () => {
			panZoom.onTouchEnd(touchEvent([], [touch(100, 100, 0), touch(202, 100, 1)]));

			expect(panZoom.scale).toBe(1);
		});

		it('ignores a pinch that started with both fingers on the same pixel', () => {
			panZoom.onTouchStart(touchEvent([touch(100, 100, 0), touch(100, 100, 1)]));
			expect(panZoom.initialDistance).toBe(0);

			panZoom.onTouchEnd(touchEvent([], [touch(50, 100, 0), touch(250, 100, 1)]));

			// without a zero check the ratio is Infinity and the board snaps to maximum zoom
			expect(panZoom.scale).toBe(1);
		});

		it('reads the final points from the fingers still down', () => {
			panZoom.onTouchEnd(touchEvent([touch(50, 100, 0), touch(250, 100, 1)], [touch(0, 0, 2)]));

			expect(panZoom.scale).toBe(2);
		});

		it('combines the last finger down with the one lifted', () => {
			panZoom.onTouchEnd(touchEvent([touch(50, 100, 0)], [touch(250, 100, 1)]));

			expect(panZoom.scale).toBe(2);
		});

		it('leaves the scale alone when only one point can be resolved', () => {
			panZoom.onTouchEnd(touchEvent([], [touch(50, 100, 0)]));

			expect(panZoom.scale).toBe(1);
			expect(panZoom.isPinching).toBe(false);
		});

		it('still zooms when the indicator is already gone', () => {
			indicators.gestureIndicators.set([]);

			panZoom.onTouchEnd(touchEvent([], [touch(50, 100, 0), touch(250, 100, 1)]));

			expect(panZoom.scale).toBe(2);
		});
	});

	describe('onTouchEnd after a pan', () => {
		it('reports the transform and stops panning', () => {
			zoomTo(2);
			panZoom.onTouchStart(touchEvent([touch(100, 100)]));

			panZoom.onTouchEnd(touchEvent([]));

			expect(panZoom.isPanning).toBe(false);
			expect(onTransformChange).toHaveBeenCalled();
		});

		it('clears the gesture flags once the last finger is up', () => {
			panZoom.onTouchStart(touchEvent([touch(100, 100)]));
			panZoom.hasTouchPanMoved = true;
			panZoom.hasPinchChanged = true;

			panZoom.onTouchEnd(touchEvent([]));

			expect(panZoom.hasTouchPanMoved).toBe(false);
			expect(panZoom.hasPinchChanged).toBe(false);
		});

		it('does nothing when no gesture was running', () => {
			panZoom.onTouchEnd(touchEvent([]));

			expect(panZoom.isPanning).toBe(false);
			expect(panZoom.isPinching).toBe(false);
			expect(onTransformChange).not.toHaveBeenCalled();
		});

		it('keeps the gesture flags while a finger is still down', () => {
			panZoom.onTouchStart(touchEvent([touch(100, 100, 0), touch(200, 100, 1)]));
			panZoom.hasPinchChanged = true;

			panZoom.onTouchEnd(touchEvent([touch(100, 100, 0)], [touch(200, 100, 1)]));

			expect(panZoom.hasPinchChanged).toBe(true);
		});
	});
});
