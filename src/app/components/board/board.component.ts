import { Component, ElementRef, type OnChanges, type OnInit, type SimpleChanges, inject, input, output } from '@angular/core';
import { Backgrounds, Themes } from '../../model/consts';
import { type Draw, calcDrawPos, getDrawBounds, sortDrawItems, getDrawBoundsViewPortBounds } from '../../model/draw';
import type { Stone } from '../../model/stone';
import { AppService } from '../../service/app.service';
import { imageSetIsKyodai } from '../../model/tilesets';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { Indicator } from '../../model/indicator';
import { PanZoom } from '../../model/pan-zoom';
import { PrefixPipe } from '../../pipes/prefix.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { PatternService } from '../../service/pattern.service';
import { log } from '../../model/log';

const defaultW = 1470;
const defaultH = 960;

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss'],
	host: {
		'[style.background-image]': 'backgroundUrl',
		'[class.background-repeat]': 'backgroundRepeat',
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
	readonly theme = input<string>();
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly pattern = input<string>();
	readonly stones = input<Array<Stone>>();
	readonly noRotate = input(false);
	readonly clickEvent = output<Stone | undefined>();
	backgroundUrl: string | undefined;
	backgroundRepeat: boolean | undefined;
	indicators = new Indicator();
	drawStones: Array<Draw> = [];
	rotate: boolean = false;
	transformSVG: string = '';
	transformStage: string = '';
	viewport: string = `0 0 ${defaultW} ${defaultH}`;
	prefix: string = '';
	urlPrefix: string = '';
	imagePos: Array<number> = [1, 1, 69, 88];
	imageCut: Array<number> = [0, 0, 65, 90];
	app = inject(AppService);
	patternService = inject(PatternService);
	element = inject(ElementRef);
	panZoom = new PanZoom(
		() => ({ width: this.element.nativeElement.offsetWidth || 0, height: this.element.nativeElement.offsetHeight || 0 }),
		this.indicators,
		() => {
			this.transformSVG = this.panZoom.transformSVG;
			this.setTransformStage();
		}
	);

	private bounds: Array<number> = [0, 0, defaultW, defaultH];

	get scale(): number {
		return this.panZoom.scale;
	}

	set scale(value: number) {
		this.panZoom.scale = value;
	}

	get panX(): number {
		return this.panZoom.panX;
	}

	set panX(value: number) {
		this.panZoom.panX = value;
	}

	get panY(): number {
		return this.panZoom.panY;
	}

	set panY(value: number) {
		this.panZoom.panY = value;
	}

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
		if (changes.theme || changes.pattern) {
			const current = this.background();
			if (current) {
				this.updateBackground(current);
			}
		}
		if (changes.imageSet) {
			this.prefix = `b_${changes.imageSet.currentValue}_`;
			this.urlPrefix = `#b_${changes.imageSet.currentValue}_`;
			const isKyodai = imageSetIsKyodai(changes.imageSet.currentValue);
			this.imagePos = isKyodai ? [0, 0, 75, 100] : [6, 6, 63, 88];
			this.imageCut = isKyodai ? [1, 1, 73, 98] : [0, 0, 65, 90];
		}
	}

	onResize(event: UIEvent): void {
		const element = event.target as Window;
		if (element) {
			this.resize(element);
		}
	}

	onWheel($event: WheelEvent): void {
		this.panZoom.onWheel($event);
	}

	onMouseDown(event: MouseEvent): void {
		this.panZoom.onMouseDown(event);
	}

	onMouseMove(event: MouseEvent): void {
		this.panZoom.onMouseMove(event);
	}

	onMouseUp(event: MouseEvent): void {
		if (this.panZoom.onMouseUp(event)) {
			this.clickEvent.emit(undefined);
		}
	}

	onTouchTileEnd(_event: TouchEvent, draw?: Draw): void {
		if (this.panZoom.hasPinchChanged || this.panZoom.hasTouchPanMoved) {
			return;
		}
		this.clickEvent.emit(draw?.source);
	}

	onClickUp(event: MouseEvent, draw?: Draw): void {
		this.panZoom.initialMouseX = 0;
		this.panZoom.initialMouseY = 0;
		if (this.panZoom.isPanning) {
			this.panZoom.updatePanning(event);
			this.panZoom.stopPanning();
		} else {
			this.clickEvent.emit(draw?.source);
			event.stopPropagation();
		}
	}

	onTouchStart(event: TouchEvent): void {
		this.panZoom.onTouchStart(event);
	}

	onTouchMove(event: TouchEvent): void {
		this.panZoom.onTouchMove(event);
	}

	onTouchEnd(event: TouchEvent): void {
		this.panZoom.onTouchEnd(event);
	}

	updatePanning(event: MouseEvent): void {
		this.panZoom.updatePanning(event);
	}

	setPanValue(x: number, y: number): void {
		this.panZoom.setPanValue(x, y);
	}

	zoomSVGValue(scale: number, x: number, y: number): void {
		this.panZoom.zoomSVGValue(scale, x, y);
	}

	updateViewPort(): void {
		window.requestAnimationFrame(() => {
			this.setViewPort();
		});
	}

	private setTransformStage(): void {
		if (this.rotate) {
			const [minX, minY, width, height] = getDrawBoundsViewPortBounds(this.bounds);
			const cx = minX + width / 2;
			const cy = minY + height / 2;
			this.transformStage = `rotate(90 ${cx} ${cy})`;
		} else {
			this.transformStage = '';
		}
	}

	private resize(element: { innerHeight: number; innerWidth: number }): void {
		const r = this.noRotate() ? false : element.innerHeight > element.innerWidth;
		this.panZoom.reset();
		if (r !== this.rotate) {
			this.rotate = r;
		}
		this.updateViewPort();
	}

	private setViewPort(): void {
		let [minX, minY, width, height] = getDrawBoundsViewPortBounds(this.bounds);
		if (this.rotate) {
			const cx = minX + width / 2;
			const cy = minY + height / 2;
			const rW = height;
			const rH = width;
			minX = cx - rW / 2;
			minY = cy - rH / 2;
			width = rW;
			height = rH;
		}
		this.viewport = `${minX} ${minY} ${width} ${height}`;
	}

	private updateStones(stones: Array<Stone>): void {
		if (!stones) {
			return;
		}
		this.panZoom.scale = 1;
		this.panZoom.panX = 0;
		this.panZoom.panY = 0;
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
					source: stone,
					className: stone.effects?.wiggle ? 'wiggle' : undefined
				}));
		this.bounds = getDrawBounds(items);
		this.drawStones = sortDrawItems(items);
		this.setViewPort();
		this.panZoom.syncTransformSVG();
		this.transformSVG = this.panZoom.transformSVG;
		this.setTransformStage();
	}

	private cssBarColors(): Array<string> {
		const theme = Themes.find(t => t.id === this.app.settings.theme) ?? Themes[0];
		return theme.colors;
	}

	private updateMahBackground(pattern?: string): void {
		this.backgroundUrl = '';
		if (!pattern) {
			return;
		}
		this.patternService
			.svgDataUrl(pattern, this.cssBarColors())
			.then(dataUrl => this.backgroundUrl = dataUrl)
			.catch(error => log.error(error));
	}

	private updateBackground(background: string): void {
		const bg = Backgrounds.find(b => b.img === background);
		if (!bg) {
			this.backgroundUrl = undefined;
			return;
		}
		this.backgroundRepeat = !!bg.repeat;
		if (bg.type === 'MAH') {
			this.updateMahBackground(this.pattern());
			return;
		}
		this.backgroundUrl = `url("assets/img/${bg.img}.${(bg.type ?? 'jpg')}")`;
	}
}
