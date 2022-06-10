import {Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Backgrounds} from '../../../../model/consts';
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
	@Input() zoom: number = 1;
	@Input() panX: number = 0;
	@Input() panY: number = 0;
	@Input() stones: Array<Stone>;
	@Output() readonly clickEvent = new EventEmitter<Stone>();
	@HostBinding('style.background-image') backgroundUrl: string | undefined;
	indicators = new Indicator();
	drawStones: Array<Draw> = [];
	rotate: boolean = false;
	translate: string = '';
	viewport: string = `0 0 ${defaultW} ${defaultH}`;
	prefix: string;
	urlPrefix: string;
	bounds: Array<number> = [0, 0, defaultW, defaultH];

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

	onPinch($event: Event) {
		const evt: HammerInput = $event as HammerEvent;
		this.indicators.gestureIndicators[0].size = 40 * evt.scale;
	}

	onPinchStart($event: Event) {
		const evt: HammerInput = $event as HammerEvent;
		this.indicators.gestureIndicators = [];
		this.indicators.display(evt.center.x, evt.center.y, 40);
	}

	onPinchEnd($event: Event) {
		const evt: HammerInput = $event as HammerEvent;
		this.indicators.hide(this.indicators.gestureIndicators[0]);
		let steps = 0;
		if (evt.scale > 1) {
			steps = -(evt.scale * 0.1);
		} else {
			steps = 1;
		}
		this.zoomSVGValue(this.zoom + steps, evt.center.x, evt.center.y);
	}

	setPanValue(x: number, y: number) {
		const w = (this.bounds[2] - this.bounds[0]);
		const h = (this.bounds[3] - this.bounds[1]);
		const qx = this.bounds[0] / this.zoom;
		const qy = this.bounds[1] / this.zoom;
		const border = (50 / this.zoom)
		this.panX = clamp(x, qx - border, (w / this.zoom) - w + border);
		this.panY = clamp(y, qy - border, (h / this.zoom) - h + border);
		console.log(this.panX, this.panY);
	}

	setPan(evt: HammerInput) {
		evt.preventDefault();
		const limiter = 0.15;
		this.setPanValue(this.panX - (evt.deltaX * limiter), this.panY - (evt.deltaY * limiter));
	}

	onPan($event: Event) {
		const evt: HammerInput = $event as HammerEvent;
		if (this.zoom < 1 && evt.pointers.length === 1) {
			const indicator = this.indicators.display(evt.center.x, evt.center.y, 10);
			this.indicators.hide(indicator);
			this.setPan(evt);
		}
	}

	onPanEnd($event: Event) {
		const evt: HammerInput = $event as HammerEvent;
		if (this.zoom < 1 && evt.pointers.length === 1) {
			this.setPan(evt);
			this.updateViewPort();
		}
	}

	onWheel($event: WheelEvent) {
		$event.preventDefault();
		const indicator = this.indicators.display($event.clientX, $event.clientY, 10);
		this.indicators.hide(indicator);
		let steps = 0;
		if ($event.deltaY < 0) {
			console.log($event.deltaY);
			steps = $event.deltaY * 0.006;
		} else {
			steps = 1;
		}
		this.zoomSVGValue(this.zoom + steps, $event.clientX, $event.clientY);
	}

	updateViewPort() {
		window.requestAnimationFrame(() => {
			this.setViewPort();
		});
	}

	zoomSVGValue(zoom: number, x: number, y: number) {
		const oldZoom = this.zoom;
		const z = Math.min(Math.max(0.5, zoom), 1);
		if (z === oldZoom) {
			return;
		}
		if (z >= 0.99) {
			this.zoom = 1;
			this.panX = 0;
			this.panY = 0;
		} else {
			const mouseX = x + this.panX;
			const mouseY = y + this.panY;
			const locX = mouseX * oldZoom / z;
			const locY = mouseY * oldZoom / z;
			const panX = (locX - x) * z;
			const panY = (locY - y) * z;
			this.zoom = z;
			this.setPanValue(panX, panY);
		}
		this.updateViewPort();
	}

	onMouseUp(event: MouseEvent): void {
		this.clickEvent.emit(undefined);
	}

	onClickDown(event: MouseEvent): void {
		// this.onMouseDown(event);
	}

	onClickUp(event: MouseEvent, draw?: Draw): void {
		// if (!this.mouseDrag) {
		this.clickEvent.emit(draw ? draw.source : undefined);
		// }
		// this.mouseDown = false;
		// this.mouseDrag = false;
		event.stopPropagation();
	}

	resize(element: { innerHeight: number; innerWidth: number }): void {
		const r = element.innerHeight > element.innerWidth;
		if (r !== this.rotate) {
			this.rotate = r;
			this.translate = this.rotate ? 'rotate(90)' : '';
			this.updateViewPort();
		}
	}

	onResize(event: UIEvent): void {
		const element = event.target as Window;
		if (element) {
			this.resize(element);
		}
	}

	private setViewPort(): void {
		this.viewport = getDrawBoundsViewPort(this.bounds, defaultW, defaultH, this.rotate, this.zoom, this.panX, this.panY);
	}

	private updateStones(stones: Array<Stone>): void {
		if (!stones) {
			return;
		}
		this.zoom = 1;
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
