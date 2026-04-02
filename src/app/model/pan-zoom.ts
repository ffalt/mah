import { Indicator } from './indicator';

interface TouchPoint {
	x: number;
	y: number;
	identifier: number;
}

const PAN_THRESHOLD = 10;
const ZOOM_STEP = 0.15;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(min, value), max);
}

export { ZOOM_STEP };

export class PanZoom {
	scale: number = 1;
	panX: number = 0;
	panY: number = 0;
	transformSVG: string = '';
	hasTouchPanMoved: boolean = false;
	hasPinchChanged: boolean = false;
	isPanning: boolean = false;
	isPinching: boolean = false;
	touchPoints: Array<TouchPoint> = [];
	lastMouseX: number = 0;
	lastMouseY: number = 0;
	initialMouseX: number = 0;
	initialMouseY: number = 0;
	lastTouchX: number = 0;
	lastTouchY: number = 0;
	lastPinch: number = 0;
	initialDistance: number = 0;
	private initialScale: number = 1;
	private initialTouchX: number = 0;
	private initialTouchY: number = 0;

	constructor(
		private readonly getContainerSize: () => { width: number; height: number },
		private readonly indicators: Indicator,
		private readonly onTransformChange: () => void
	) {}

	reset(): void {
		this.scale = 1;
		this.panX = 0;
		this.panY = 0;
		this.updateTransform();
	}

	onWheel(event: WheelEvent): void {
		event.preventDefault();
		const wheel = event.deltaY < 0 ? 1 : -1;
		const scale = wheel === 1 ? this.scale + ZOOM_STEP : this.scale - ZOOM_STEP;
		this.zoomSVGValue(scale, event.clientX, event.clientY);
		const indicator = this.indicators.display(event.clientX, event.clientY, scale * 10);
		this.indicators.hide(indicator);
	}

	onMouseDown(event: MouseEvent): void {
		if (this.scale > 1) {
			event.preventDefault();
			this.lastMouseX = event.clientX;
			this.lastMouseY = event.clientY;
			this.initialMouseX = event.clientX;
			this.initialMouseY = event.clientY;
		}
	}

	onMouseMove(event: MouseEvent): void {
		if (this.scale > 1) {
			if (!this.isPanning && this.initialMouseX !== 0 && this.initialMouseY !== 0) {
				const dx = event.clientX - this.initialMouseX;
				const dy = event.clientY - this.initialMouseY;
				if (Math.hypot(dx, dy) >= PAN_THRESHOLD) {
					this.isPanning = true;
				}
			}
			if (this.isPanning) {
				event.preventDefault();
				this.updatePanning(event);
			}
		}
	}

	// Returns true if the event should be treated as a board click
	onMouseUp(event: MouseEvent): boolean {
		const isMouseLeave = event.type === 'mouseleave';
		let clicked = false;
		if (this.isPanning) {
			event.preventDefault();
			this.updatePanning(event);
		} else if (!isMouseLeave) {
			if (this.scale === 1) {
				clicked = true;
			} else if (this.initialMouseX !== 0 && this.initialMouseY !== 0) {
				const dx = event.clientX - this.initialMouseX;
				const dy = event.clientY - this.initialMouseY;
				clicked = Math.hypot(dx, dy) < 4;
			}
		}
		this.stopPanning();
		return clicked;
	}

	onTouchStart(event: TouchEvent): void {
		event.preventDefault();
		this.touchPoints = this.extractTouchPoints(event.touches);
		this.hasTouchPanMoved = false;
		this.hasPinchChanged = false;

		if (this.touchPoints.length === 1) {
			this.lastTouchX = this.touchPoints[0].x;
			this.lastTouchY = this.touchPoints[0].y;
			this.initialTouchX = this.touchPoints[0].x;
			this.initialTouchY = this.touchPoints[0].y;
			this.isPanning = true;
		} else if (this.touchPoints.length === 2) {
			this.isPanning = false;
			this.isPinching = true;
			this.initialDistance = this.distance(this.touchPoints[0], this.touchPoints[1]);
			this.initialScale = this.scale;
			this.indicators.gestureIndicators = [];
			const centerX = (this.touchPoints[0].x + this.touchPoints[1].x) / 2;
			const centerY = (this.touchPoints[0].y + this.touchPoints[1].y) / 2;
			this.indicators.display(centerX, centerY, 30);
			this.lastPinch = Date.now();
		}
	}

	onTouchMove(event: TouchEvent): void {
		event.preventDefault();
		this.touchPoints = this.extractTouchPoints(event.touches);

		if (this.isPinching && this.touchPoints.length === 2) {
			const currentDistance = this.distance(this.touchPoints[0], this.touchPoints[1]);
			// Avoid division by zero if initial distance is zero (both points at same location)
			const relativeScale = this.initialDistance > 0 ? currentDistance / this.initialDistance : 1;
			const centerX = (this.touchPoints[0].x + this.touchPoints[1].x) / 2;
			const centerY = (this.touchPoints[0].y + this.touchPoints[1].y) / 2;
			if (this.indicators.gestureIndicators[0]) {
				const gi = this.indicators.gestureIndicators[0];
				gi.x = centerX;
				gi.y = centerY;
				gi.top = centerY - (gi.size / 2);
				gi.left = centerX - (gi.size / 2);
			} else {
				this.indicators.display(centerX, centerY, 30);
			}
			const size = clamp(30 * relativeScale, 10, 80);
			this.indicators.setSize(0, size);
			if (Math.abs(relativeScale - 1) >= 0.1) {
				this.hasPinchChanged = true;
			}
			this.lastPinch = Date.now();
		} else if (this.isPanning && this.touchPoints.length === 1 && this.scale > 1 && Date.now() - this.lastPinch > 600) {
			const currentX = this.touchPoints[0].x;
			const currentY = this.touchPoints[0].y;
			const deltaX = currentX - this.lastTouchX;
			const deltaY = currentY - this.lastTouchY;

			const moved = Math.hypot(currentX - this.initialTouchX, currentY - this.initialTouchY);
			if (moved >= PAN_THRESHOLD) {
				this.hasTouchPanMoved = true;
				const indicator = this.indicators.display(currentX, currentY, 10);
				this.indicators.hide(indicator);
			}

			this.setPanValue(this.panX + deltaX, this.panY + deltaY);
			this.lastTouchX = currentX;
			this.lastTouchY = currentY;
		}
	}

	onTouchEnd(event: TouchEvent): void {
		event.preventDefault();

		if (this.isPinching) {
			const indicator = this.indicators.gestureIndicators.at(0);
			if (indicator) {
				this.indicators.hide(indicator);
			}
			const remaining = this.extractTouchPoints(event.touches);
			const changed = this.extractTouchPoints(event.changedTouches);
			const finalPoints: Array<TouchPoint> = [];
			if (remaining.length >= 2) {
				finalPoints.push(remaining[0], remaining[1]);
			} else if (remaining.length === 1 && changed.length > 0) {
				finalPoints.push(remaining[0], changed[0]);
			} else if (changed.length >= 2) {
				finalPoints.push(changed[0], changed[1]);
			}

			if (finalPoints.length === 2) {
				const currentDistance = this.distance(finalPoints[0], finalPoints[1]);
				const relativeScale = currentDistance / this.initialDistance;
				let newScale = this.initialScale;
				if (Math.abs(relativeScale - 1) >= 0.1) {
					newScale = this.initialScale * relativeScale;
				}
				const centerX = (finalPoints[0].x + finalPoints[1].x) / 2;
				const centerY = (finalPoints[0].y + finalPoints[1].y) / 2;
				this.zoomSVGValue(newScale, centerX, centerY);
			}

			this.isPinching = false;
			this.lastPinch = Date.now();
		} else if (this.isPanning) {
			this.updateTransform();
			this.isPanning = false;
		}

		this.touchPoints = this.extractTouchPoints(event.touches);
		if (this.touchPoints.length === 0) {
			this.hasTouchPanMoved = false;
			this.hasPinchChanged = false;
			this.initialTouchX = 0;
			this.initialTouchY = 0;
		}
	}

	updatePanning(event: MouseEvent): void {
		const deltaX = event.clientX - this.lastMouseX;
		const deltaY = event.clientY - this.lastMouseY;
		const indicator = this.indicators.display(event.clientX, event.clientY, 10);
		this.indicators.hide(indicator);
		this.setPanValue(this.panX + deltaX, this.panY + deltaY);
		this.lastMouseX = event.clientX;
		this.lastMouseY = event.clientY;
		this.updateTransform();
	}

	stopPanning(): void {
		this.isPanning = false;
		this.initialMouseX = 0;
		this.initialMouseY = 0;
	}

	setPanValue(x: number, y: number): void {
		// Compute pan bounds relative to the scaled content size within the container.
		// Allow a small visual margin to avoid hard edges during interactions.
		const { width: containerWidth, height: containerHeight } = this.getContainerSize();
		const margin = 50;

		// Handle edge case: container not properly sized
		if (containerWidth <= 0 || containerHeight <= 0) {
			// Still update pan values to prevent inconsistent state, but reset to origin
			// since we can't calculate proper bounds without container dimensions
			if (this.panX !== 0 || this.panY !== 0) {
				this.panX = 0;
				this.panY = 0;
			}
			return;
		}

		// Extra size introduced by scaling (when scale <= 1, extra is 0 and panning is effectively disabled elsewhere)
		const extraWidth = Math.max(0, (this.scale - 1) * containerWidth);
		const extraHeight = Math.max(0, (this.scale - 1) * containerHeight);

		// Clamp so that content cannot be panned beyond its scaled bounds (with a small margin)
		const minX = -extraWidth - margin;
		const maxX = margin;
		const minY = -extraHeight - margin;
		const maxY = margin;

		this.panX = clamp(x, minX, maxX);
		this.panY = clamp(y, minY, maxY);
	}

	zoomSVGValue(scale: number, x: number, y: number): void {
		const oldScale = this.scale;
		const z = clamp(scale, 1, 2);
		if (z === oldScale) {
			return;
		}
		if (z < 1.01) {
			this.scale = 1;
			this.panX = 0;
			this.panY = 0;
		} else {
			const xs = (x - this.panX) / this.scale;
			const ys = (y - this.panY) / this.scale;
			this.scale = z;
			this.setPanValue(x - xs * z, y - ys * z);
		}
		this.updateTransform();
	}

	updateTransform(): void {
		window.requestAnimationFrame(() => {
			this.syncTransformSVG();
			this.onTransformChange();
		});
	}

	syncTransformSVG(): void {
		const scaling = this.scale > 1 ? ` scale(${this.scale})` : '';
		this.transformSVG = `translate(${this.panX}px, ${this.panY}px)${scaling}`;
	}

	private distance(p1: TouchPoint, p2: TouchPoint): number {
		return Math.hypot(p2.x - p1.x, p2.y - p1.y);
	}

	private extractTouchPoints(touches: TouchList): Array<TouchPoint> {
		return Array.from(touches).map(t => ({ x: t.clientX, y: t.clientY, identifier: t.identifier }));
	}
}