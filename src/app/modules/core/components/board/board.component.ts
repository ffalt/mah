import { Component, ElementRef, inject, OnChanges, OnInit, SimpleChanges, output, input } from '@angular/core';
import { Backgrounds } from '../../../../model/consts';
import { calcDrawPos, type Draw, getDrawBounds, getDrawBoundsViewPort, sortDrawItems } from '../../../../model/draw';
import type { Stone } from '../../../../model/stone';
import { AppService } from '../../../../service/app.service';
import { Indicator, IndicatorAnimations } from '../../model/indicator';
import { imageSetIsKyodai } from '../../model/tilesets';

type HammerEvent = HammerInput & Event;
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
	standalone: false,
	host: {
		'[style.background-image]': 'backgroundUrl',
		'(pinch)': 'onPinch($event)',
		'(pinchstart)': 'onPinchStart($event)',
		'(pinchend)': 'onPinchEnd($event)',
		'(pan)': 'onPan($event)',
		'(panend)': 'onPanEnd($event)',
		'(wheel)': 'onWheel($event)',
		'(window:resize)': 'onResize($event)'
	}
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

	onPinch(evt: HammerEvent) {
		this.indicators.setSize(0, 40 * evt.scale);
		evt.preventDefault();
		this.lastPinch = Date.now();
	}

	onPinchStart(evt: HammerEvent) {
		this.indicators.gestureIndicators = [];
		this.indicators.display(evt.center.x, evt.center.y, 40);
		evt.preventDefault();
		this.lastPinch = Date.now();
	}

	onPinchEnd(evt: HammerEvent) {
		this.indicators.hide(this.indicators.gestureIndicators[0]);
		let scale = 1;
		if (evt.scale > 1.1) {
			scale = this.scale + (0.2 * evt.scale);
		}
		this.zoomSVGValue(scale, evt.center.x, evt.center.y);
		evt.preventDefault();
		this.lastPinch = Date.now();
	}

	onPan(evt: HammerEvent) {
		this.setPan(evt);
	}

	onPanEnd(evt: HammerEvent) {
		this.setPan(evt);
		this.updateTransform();
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

	onMouseUp(_event: MouseEvent): void {
		this.clickEvent.emit(undefined);
	}

	onClickUp(event: MouseEvent, draw?: Draw): void {
		this.clickEvent.emit(draw ? draw.source : undefined);
		event.stopPropagation();
	}

	setPan(evt: HammerEvent) {
		if (this.scale > 1 && evt.pointers.length === 1 && Date.now() - this.lastPinch > 600) {
			const indicator = this.indicators.display(evt.center.x, evt.center.y, 10);
			this.indicators.hide(indicator);
			const limiter = 0.05;
			this.setPanValue(this.panX + (evt.deltaX * limiter), this.panY + (evt.deltaY * limiter));
			evt.preventDefault();
		}
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
		this.viewport = getDrawBoundsViewPort(this.bounds, defaultW, defaultH, this.rotate);
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
