import {Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Backgrounds, Consts} from '../../../../model/consts';
import {calcDrawPos, Draw, getDrawBounds, getDrawBoundsViewPort, sortDrawItems} from '../../../../model/draw';
import {Stone} from '../../../../model/stone';
import {AppService} from '../../../../service/app.service';
import {Indicator, IndicatorAnimations} from '../../model/indicator';

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
	animations: IndicatorAnimations
})
export class BoardComponent implements OnInit, OnChanges {
	@Input() background: string;
	@Input() imageSet: string;
	@Input() stones: Array<Stone>;
	@Output() readonly clickEvent = new EventEmitter<Stone>();
	@HostBinding('style.background-image') backgroundUrl: string | undefined;
	indicators = new Indicator();
	drawStones: Array<Draw> = [];
	rotate: boolean = false;
	transformSVG: string = '';
	transformStage: string = '';
	viewport: string = `0 0 ${defaultW} ${defaultH}`;
	prefix: string;
	urlPrefix: string;
	bounds: Array<number> = [0, 0, defaultW, defaultH];
	scale: number = 1;
	panX: number = 0;
	panY: number = 0;

	constructor(public app: AppService) {
	}

	ngOnInit(): void {
		this.resize(window);
	}

	trackByDrawStone(index: number, draw: Draw): string {
		return `${draw.source.groupnr}/${draw.source.v}`;
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
		}
	}

	@HostListener('pinch', ['$event'])
	onPinch(evt: HammerEvent) {
		this.indicators.setSize(0, 40 * evt.scale);
	}

	@HostListener('pinchstart', ['$event'])
	onPinchStart(evt: HammerEvent) {
		this.indicators.gestureIndicators = [];
		this.indicators.display(evt.center.x, evt.center.y, 40);
	}

	@HostListener('pinchend', ['$event'])
	onPinchEnd(evt: HammerEvent) {
		this.indicators.hide(this.indicators.gestureIndicators[0]);
		let scale = 1;
		if (evt.scale > 1.1) {
			scale = this.scale + (0.2 * evt.scale);
		}
		this.zoomSVGValue(scale, evt.center.x, evt.center.y);
		evt.preventDefault();
	}

	setPanValue(x: number, y: number) {
		const minX = (this.bounds[2] - this.bounds[0]) * this.scale;
		const minY = (this.bounds[3] - this.bounds[1]) * this.scale;
		this.panX = clamp(x, -minX, 0);
		this.panY = clamp(y, -minY, 0);
	}

	setPan(evt: HammerEvent) {
		evt.preventDefault();
		const limiter = 0.05;
		this.setPanValue(this.panX + (evt.deltaX * limiter), this.panY + (evt.deltaY * limiter));
	}

	@HostListener('pan', ['$event'])
	onPan(evt: HammerEvent) {
		if (this.scale > 1 && evt.pointers.length === 1) {
			const indicator = this.indicators.display(evt.center.x, evt.center.y, 10);
			this.indicators.hide(indicator);
			this.setPan(evt);
		}
	}

	@HostListener('panend', ['$event'])
	onPanEnd(evt: HammerEvent) {
		if (this.scale > 1 && evt.pointers.length === 1) {
			this.setPan(evt);
			this.updateViewPort();
		}
	}

	onWheel($event: WheelEvent) {
		$event.preventDefault();
		const indicator = this.indicators.display($event.clientX, $event.clientY, 10);
		this.indicators.hide(indicator);
		const wheel = $event.deltaY < 0 ? 1 : -1;
		let scale = 1;
		if (wheel === 1) {
			scale = this.scale + 0.15;
		}
		this.zoomSVGValue(scale, $event.clientX, $event.clientY);
	}

	updateViewPort() {
		window.requestAnimationFrame(() => {
			this.setViewPort();
		});
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

	onMouseUp(event: MouseEvent): void {
		this.clickEvent.emit(undefined);
	}

	onClickDown(event: MouseEvent): void {
		// this.onMouseDown(event);
	}

	onClickUp(event: MouseEvent, draw?: Draw): void {
		this.clickEvent.emit(draw ? draw.source : undefined);
		event.stopPropagation();
	}

	resize(element: { innerHeight: number; innerWidth: number }): void {
		const r = element.innerHeight > element.innerWidth;
		if (r !== this.rotate) {
			this.rotate = r;
			this.updateViewPort();
		}
	}

	updateTransform() {
		this.transformSVG = `translate(${this.panX}px, ${this.panY}px)${this.scale > 1 ? ` scale(${this.scale})` : ''}`;
		this.transformStage = this.rotate ? 'rotate(90)' : '';
	}

	@HostListener('window:resize', ['$event'])
	onResize(event: UIEvent): void {
		const element = event.target as Window;
		if (element) {
			this.resize(element);
		}
	}

	private setViewPort(): void {
		this.updateTransform();
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
	}

	private updateBackground(background: string): void {
		const back = Backgrounds.find(b => b.img === background);
		this.backgroundUrl = back && back.img ? `url("assets/img/${back.img}")` : undefined;
	}

}
