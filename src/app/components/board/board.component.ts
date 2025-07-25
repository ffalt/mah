import { Component, ElementRef, type OnChanges, type OnInit, type SimpleChanges, inject, input, output } from '@angular/core';
import { Backgrounds } from '../../model/consts';
import { type Draw, calcDrawPos, getDrawBounds, getDrawBoundsViewPort, sortDrawItems } from '../../model/draw';
import type { Stone } from '../../model/stone';
import { AppService } from '../../service/app.service';
import { imageSetIsKyodai } from '../../model/tilesets';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { Indicator, IndicatorAnimations } from '../../model/indicator';
import { PrefixPipe } from '../../pipes/prefix.pipe';
import { TranslatePipe } from '@ngx-translate/core';

interface TouchPoint {
	x: number;
	y: number;
	identifier: number;
}

const defaultW = 1470;
const defaultH = 960;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(min, value), max);
}

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss'],
	animations: IndicatorAnimations,
	host: {
		'[style.background-image]': 'backgroundUrl',
		'(wheel)': 'onWheel($event)',
		'(window:resize)': 'onResize($event)',
		'(mousedown)': 'onMouseDown($event)',
		'(mousemove)': 'onMouseMove($event)',
		'(mouseup)': 'onMouseUp($event)',
		'(mouseleave)': 'onMouseUp($event)',
		'(touchstart)': 'onTouchStart($event)',
		'(touchmove)': 'onTouchMove($event)',
		'(touchend)': 'onTouchEnd($event)',
		'(touchcancel)': 'onTouchEnd($event)'
	},
	imports: [ImageSetLoaderComponent, PrefixPipe, TranslatePipe]
})
export class BoardComponent implements OnInit, OnChanges {
	readonly background = input<string>();
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly stones = input<Array<Stone>>();
	readonly clickEvent = output<Stone | undefined>();
	backgroundUrl: string | undefined;
	indicators = new Indicator();
	drawStones: Array<Draw> = [];
	rotate: boolean = false;
	transformSVG: string = '';
	transformStage: string = '';
	viewport: string = `0 0 ${defaultW} ${defaultH}`;
	prefix: string;
	urlPrefix: string;
	bounds: Array<number> = [0, 0, defaultW, defaultH];
	imagePos: Array<number> = [6, 6, 63, 88];
	scale: number = 1;
	panX: number = 0;
	panY: number = 0;
	lastPinch: number = 0;
	// Touch and mouse tracking properties
	private touchPoints: Array<TouchPoint> = [];
	private initialDistance: number = 0;
	private initialScale: number = 1;
	private lastTouchX: number = 0;
	private lastTouchY: number = 0;
	private lastMouseX: number = 0;
	private lastMouseY: number = 0;
	private initialMouseX: number = 0;
	private initialMouseY: number = 0;
	private isPanning: boolean = false;
	private isPinching: boolean = false;
	app = inject(AppService);
	element = inject(ElementRef);

	ngOnInit(): void {
		this.resize(window);
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.stones) {
			this.updateStones(changes.stones.currentValue);
		}
		if (changes.background) {
			this.updateBackground(changes.background.currentValue);
		}
		if (changes.imageSet) {
			this.prefix = `b_${changes.imageSet.currentValue}_`;
			this.urlPrefix = `#b_${changes.imageSet.currentValue}_`;
			this.imagePos = imageSetIsKyodai(changes.imageSet.currentValue) ? [0, 0, 75, 100] : [6, 6, 63, 88];
		}
	}

	onWheel($event: WheelEvent) {
		$event.preventDefault();
		const wheel = $event.deltaY < 0 ? 1 : -1;
		let scale = 1;
		if (wheel === 1) {
			scale = this.scale + 0.15;
		}
		this.zoomSVGValue(scale, $event.clientX, $event.clientY);
		const indicator = this.indicators.display($event.clientX, $event.clientY, scale * 10);
		this.indicators.hide(indicator);
	}

	onResize(event: UIEvent): void {
		const element = event.target as Window;
		if (element) {
			this.resize(element);
		}
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
			// Check if we're in a potential panning state (mouse down but not yet panning)
			if (!this.isPanning && this.initialMouseX !== 0 && this.initialMouseY !== 0) {
				// Calculate distance moved from initial position
				const dx = event.clientX - this.initialMouseX;
				const dy = event.clientY - this.initialMouseY;
				const distance = Math.hypot(dx, dy);

				// Start panning only if moved at least 10px
				if (distance >= 10) {
					this.isPanning = true;
				}
			}

			// Continue with panning if isPanning is true
			if (this.isPanning) {
				event.preventDefault();
				this.updatePanning(event);
			}
		}
	}

	onMouseUp(event: MouseEvent): void {
		if (this.isPanning) {
			event.preventDefault();
			this.updatePanning(event);
		} else {
			this.clickEvent.emit(undefined);
		}
		this.stopPanning();
	}

	onClickUp(event: MouseEvent, draw?: Draw): void {
		if (this.isPanning) {
			this.updatePanning(event);
			this.stopPanning();
		} else {
			this.clickEvent.emit(draw ? draw.source : undefined);
			event.stopPropagation();
		}
	}

	onTouchStart(event: TouchEvent): void {
		event.preventDefault();
		this.touchPoints = [];
		// eslint-disable-next-line unicorn/prefer-spread
		const touches = Array.from(event.touches);
		for (const touch of touches) {
			this.touchPoints.push({
				x: touch.clientX,
				y: touch.clientY,
				identifier: touch.identifier
			});
		}

		if (this.touchPoints.length === 1) {
			// Potential pan start
			this.lastTouchX = this.touchPoints[0].x;
			this.lastTouchY = this.touchPoints[0].y;
			this.isPanning = true;
		} else if (this.touchPoints.length === 2) {
			// Potential pinch start
			this.isPanning = false;
			this.isPinching = true;
			this.initialDistance = this.getDistance(this.touchPoints[0], this.touchPoints[1]);
			this.initialScale = this.scale;

			// Show pinch indicator
			const centerX = (this.touchPoints[0].x + this.touchPoints[1].x) / 2;
			const centerY = (this.touchPoints[0].y + this.touchPoints[1].y) / 2;
			this.indicators.gestureIndicators = [];
			this.indicators.display(centerX, centerY, 30);
			this.lastPinch = Date.now();
		}
	}

	onTouchMove(event: TouchEvent): void {
		event.preventDefault();
		this.touchPoints = [];
		// eslint-disable-next-line unicorn/prefer-spread
		const touches = Array.from(event.touches);
		for (const touch of touches) {
			this.touchPoints.push({
				x: touch.clientX,
				y: touch.clientY,
				identifier: touch.identifier
			});
		}

		if (this.isPinching && this.touchPoints.length === 2) {
			// Handle pinch
			const currentDistance = this.getDistance(this.touchPoints[0], this.touchPoints[1]);
			const scale = currentDistance / this.initialDistance;
			// Update indicator size
			this.indicators.setSize(0, Math.min(30 * scale, 80));
			this.lastPinch = Date.now();
		} else if (this.isPanning && this.touchPoints.length === 1 && this.scale > 1 && Date.now() - this.lastPinch > 600) {
			// Handle pan
			const deltaX = this.touchPoints[0].x - this.lastTouchX;
			const deltaY = this.touchPoints[0].y - this.lastTouchY;

			const indicator = this.indicators.display(this.touchPoints[0].x, this.touchPoints[0].y, 10);
			this.indicators.hide(indicator);

			this.setPanValue(this.panX + deltaX, this.panY + deltaY);

			this.lastTouchX = this.touchPoints[0].x;
			this.lastTouchY = this.touchPoints[0].y;
		}
	}

	onTouchEnd(event: TouchEvent): void {
		event.preventDefault();

		if (this.isPinching) {
			// Handle pinch end
			this.indicators.hide(this.indicators.gestureIndicators[0]);

			if (this.touchPoints.length === 2) {
				const currentDistance = this.getDistance(this.touchPoints[0], this.touchPoints[1]);
				const scale = currentDistance / this.initialDistance;

				let newScale = this.initialScale;
				if (scale > 1.1) {
					newScale = this.initialScale + scale;
				} else if (scale < 0.9) {
					newScale = this.initialScale * scale;
				}

				// Center of the pinch
				const centerX = (this.touchPoints[0].x + this.touchPoints[1].x) / 2;
				const centerY = (this.touchPoints[0].y + this.touchPoints[1].y) / 2;

				this.zoomSVGValue(newScale, centerX, centerY);
			}

			this.isPinching = false;
			this.lastPinch = Date.now();
		} else if (this.isPanning) {
			// Handle pan end
			this.updateTransform();
			this.isPanning = false;
		}

		// Update touch points
		this.touchPoints = [];
		// eslint-disable-next-line unicorn/prefer-spread
		const touches = Array.from(event.touches);
		for (const touch of touches) {
			this.touchPoints.push({
				x: touch.clientX,
				y: touch.clientY,
				identifier: touch.identifier
			});
		}
	}

	updatePanning(event: MouseEvent) {
		const deltaX = event.clientX - this.lastMouseX;
		const deltaY = event.clientY - this.lastMouseY;
		const indicator = this.indicators.display(event.clientX, event.clientY, 10);
		this.indicators.hide(indicator);
		this.setPanValue(this.panX + deltaX, this.panY + deltaY);
		this.lastMouseX = event.clientX;
		this.lastMouseY = event.clientY;
		this.updateTransform();
	}

	stopPanning() {
		this.isPanning = false;
		this.initialMouseX = 0;
		this.initialMouseY = 0;
	}

	setPanValue(x: number, y: number) {
		const minX = -this.element.nativeElement.offsetWidth;
		const minY = -this.element.nativeElement.offsetHeight;
		this.panX = clamp(x, minX - 50, 50);
		this.panY = clamp(y, minY - 50, 50);
	}

	zoomSVGValue(scale: number, x: number, y: number) {
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
			const panX = x - xs * z;
			const panY = y - ys * z;
			this.scale = z;
			this.setPanValue(panX, panY);
		}
		this.updateTransform();
	}

	updateViewPort() {
		window.requestAnimationFrame(() => {
			this.setViewPort();
		});
	}

	updateTransform() {
		window.requestAnimationFrame(() => {
			this.setTransform();
		});
	}

	setTransform() {
		const scaling = this.scale > 1 ? ` scale(${this.scale})` : '';
		this.transformSVG = `translate(${this.panX}px, ${this.panY}px)${scaling}`;
		this.transformStage = this.rotate ? 'rotate(90)' : '';
	}

	// Helper method to calculate distance between two touch points
	private getDistance(p1: TouchPoint, p2: TouchPoint): number {
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		return Math.hypot(dx, dy);
	}

	private resize(element: { innerHeight: number; innerWidth: number }): void {
		const r = element.innerHeight > element.innerWidth;
		this.panX = 0;
		this.panY = 0;
		this.scale = 1;
		this.updateTransform();
		if (r !== this.rotate) {
			this.rotate = r;
			this.updateViewPort();
		}
	}

	private setViewPort(): void {
		this.viewport = getDrawBoundsViewPort(this.bounds, this.rotate);
	}

	private updateStones(stones: Array<Stone>): void {
		if (!stones) {
			return;
		}
		this.scale = 1;
		this.panX = 0;
		this.panY = 0;
		const items = stones
			.filter((stone: Stone) => (stone !== undefined))
			.map((stone: Stone): Draw =>
				({
					z: stone.z,
					x: stone.x,
					y: stone.y,
					v: stone.v,
					visible: true,
					url: stone.img?.id,
					pos: calcDrawPos(stone.z, stone.x, stone.y),
					source: stone
				}));
		this.bounds = getDrawBounds(items, defaultW, defaultH);
		this.drawStones = sortDrawItems(items);
		this.setViewPort();
		this.setTransform();
	}

	private updateBackground(background: string): void {
		const back = Backgrounds.find(b => b.img === background);
		this.backgroundUrl = back?.img ? `url("assets/img/${back.img}")` : undefined;
	}
}
