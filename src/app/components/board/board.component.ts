import { Component, ElementRef, type AfterViewInit, type OnChanges, type OnInit, type SimpleChanges, inject, input, output, signal, viewChild } from '@angular/core';
import { Backgrounds, Themes } from '../../model/consts';
import { type Draw, calcDrawPos, getDrawBounds, sortDrawItems, getDrawBoundsViewportBounds, groupDrawsByLevel, DrawLevel } from '../../model/draw';
import type { Stone } from '../../model/stone';
import { AppService } from '../../service/app.service';
import { isKyodaiImageSet } from '../../model/tilesets';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { BoardTileComponent } from '../board-tile/board-tile.component';
import { GestureIndicatorsComponent } from '../gesture-indicators/gesture-indicators.component';
import { Indicator } from '../../model/indicator';
import { PanZoom } from '../../model/pan-zoom';
import { PatternService } from '../../service/pattern.service';
import { log } from '../../model/log';

const defaultW = 1470;
const defaultH = 960;

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss'],
	host: {
		'[style.background-image]': 'backgroundUrl()',
		'[class.background-repeat]': 'backgroundRepeat()',
		'(wheel)': 'onWheel($event)',
		'(window:resize)': 'onResize($event)',
		'(mousedown)': 'onMouseDown($event)',
		'(mouseup)': 'onMouseUp($event)',
		'(mouseleave)': 'onMouseUp($event)',
		'(keydown.enter)': 'onKeyDown($event)',
		'(keydown.space)': 'onKeyDown($event)',
		'(touchstart)': 'onTouchStart($event)',
		'(touchend)': 'onTouchEnd($event)',
		'(touchcancel)': 'onTouchEnd($event)'
	},
	imports: [ImageSetLoaderComponent, BoardTileComponent, GestureIndicatorsComponent]
})
export class BoardComponent implements OnInit, OnChanges, AfterViewInit {
	readonly background = input<string>();
	readonly theme = input<string>();
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly pattern = input<string>();
	readonly stones = input<Array<Stone>>();
	readonly noRotate = input(false);
	readonly clickEvent = output<Stone | undefined>();
	readonly backgroundUrl = signal<string | undefined>(undefined);
	readonly backgroundRepeat = signal<boolean | undefined>(undefined);
	readonly rotate = signal(false);
	readonly boardSVG = viewChild<ElementRef<SVGSVGElement>>('boardSVG');
	readonly stage = viewChild<ElementRef<SVGGElement>>('stage');
	readonly viewport = signal(`0 0 ${defaultW} ${defaultH}`);
	indicators = new Indicator();
	drawStones: Array<Draw> = [];
	drawLevels: Array<DrawLevel> = [];
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
			this.applyTransformSVG();
			this.setTransformStage();
		}
	);

	private bounds: Array<number> = [0, 0, defaultW, defaultH];
	private stageTransform = '';
	private readonly mouseMoveListener = (event: MouseEvent) => this.onMouseMove(event);
	private readonly touchMoveListener = (event: TouchEvent) => this.onTouchMove(event);
	private mouseMoveAttached = false;
	private touchMoveAttached = false;

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

	ngAfterViewInit(): void {
		this.applyTransformSVG();
		this.applyTransformStage();
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
			const isKyodai = isKyodaiImageSet(changes.imageSet.currentValue);
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
		if (this.panZoom.scale > 1) {
			this.attachMouseMoveListener();
		}
	}

	onMouseMove(event: MouseEvent): void {
		this.panZoom.onMouseMove(event);
	}

	onMouseUp(event: MouseEvent): void {
		this.detachMouseMoveListener();
		const draw = this.eventDraw(event);
		if (draw) {
			if (this.panZoom.isPanning) {
				this.panZoom.onMouseUp(event);
			} else {
				this.panZoom.stopPanning();
				this.clickEvent.emit(draw.source);
				event.stopPropagation();
			}
			return;
		}
		if (this.panZoom.onMouseUp(event)) {
			this.clickEvent.emit(undefined);
		}
	}

	onKeyDown(event: Event): void {
		const draw = this.eventDraw(event);
		if (!draw) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		this.clickEvent.emit(draw.source);
		if (draw.source.picked()) {
			this.focusNextInteractive();
		}
	}

	onTouchStart(event: TouchEvent): void {
		this.panZoom.onTouchStart(event);
		this.attachTouchMoveListener();
	}

	onTouchMove(event: TouchEvent): void {
		this.panZoom.onTouchMove(event);
	}

	onTouchEnd(event: TouchEvent): void {
		const draw = event.type === 'touchend' && !this.panZoom.hasPinchChanged && !this.panZoom.hasTouchPanMoved ? this.eventDraw(event) : undefined;
		this.panZoom.onTouchEnd(event);
		if (event.touches.length === 0) {
			this.detachTouchMoveListener();
		}
		if (draw) {
			this.clickEvent.emit(draw.source);
		}
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

	private attachMouseMoveListener(): void {
		if (this.mouseMoveAttached) {
			return;
		}
		this.mouseMoveAttached = true;
		this.element.nativeElement.addEventListener('mousemove', this.mouseMoveListener);
	}

	private detachMouseMoveListener(): void {
		if (!this.mouseMoveAttached) {
			return;
		}
		this.mouseMoveAttached = false;
		this.element.nativeElement.removeEventListener('mousemove', this.mouseMoveListener);
	}

	private attachTouchMoveListener(): void {
		if (this.touchMoveAttached) {
			return;
		}
		this.touchMoveAttached = true;
		this.element.nativeElement.addEventListener('touchmove', this.touchMoveListener, { passive: false });
	}

	private detachTouchMoveListener(): void {
		if (!this.touchMoveAttached) {
			return;
		}
		this.touchMoveAttached = false;
		this.element.nativeElement.removeEventListener('touchmove', this.touchMoveListener);
	}

	private eventDraw(event: Event): Draw | undefined {
		const target = event.target instanceof Element ? event.target.closest<SVGGElement>('g.draw') : undefined;
		const key = target?.dataset.drawKey;
		return key ? this.drawStones.find(draw => draw.key === key) : undefined;
	}

	private focusNextInteractive(): void {
		window.requestAnimationFrame(() => {
			if (this.app.game.isRunning()) {
				this.stage()?.nativeElement.querySelector<SVGGElement>('g.draw[tabindex="0"]')?.focus();
			}
		});
	}

	private setTransformStage(): void {
		if (this.rotate()) {
			const [minX, minY, width, height] = getDrawBoundsViewportBounds(this.bounds);
			const cx = minX + width / 2;
			const cy = minY + height / 2;
			this.stageTransform = `rotate(90 ${cx} ${cy})`;
		} else {
			this.stageTransform = '';
		}
		this.applyTransformStage();
	}

	private applyTransformSVG(): void {
		const svg = this.boardSVG()?.nativeElement;
		if (!svg) {
			return;
		}
		svg.style.transform = this.panZoom.transformSVG;
	}

	private applyTransformStage(): void {
		const stage = this.stage()?.nativeElement;
		if (!stage) {
			return;
		}
		stage.setAttribute('transform', this.stageTransform);
	}

	private resize(element: { innerHeight: number; innerWidth: number }): void {
		const r = this.noRotate() ? false : element.innerHeight > element.innerWidth;
		// only a rotation invalidates the pan/zoom frame - plain resizes (mobile url bar, window drag) must keep the player's view
		if (r === this.rotate()) {
			this.panZoom.clampPan();
		} else {
			this.rotate.set(r);
			this.panZoom.reset();
		}
		this.updateViewPort();
	}

	private setViewPort(): void {
		let [minX, minY, width, height] = getDrawBoundsViewportBounds(this.bounds);
		if (this.rotate()) {
			const cx = minX + width / 2;
			const cy = minY + height / 2;
			const rW = height;
			const rH = width;
			minX = cx - rW / 2;
			minY = cy - rH / 2;
			width = rW;
			height = rH;
		}
		this.viewport.set(`${minX} ${minY} ${width} ${height}`);
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
					key: `${stone.z}:${stone.x}:${stone.y}`,
					url: stone.img?.id,
					pos: calcDrawPos(stone.z, stone.x, stone.y),
					source: stone
				}));
		this.bounds = getDrawBounds(items);
		this.drawStones = sortDrawItems(items);
		this.drawLevels = groupDrawsByLevel(this.drawStones);
		this.setViewPort();
		this.panZoom.syncTransformSVG();
		this.applyTransformSVG();
		this.setTransformStage();
	}

	private cssBarColors(): Array<string> {
		const theme = Themes.find(t => t.id === this.app.settings.theme()) ?? Themes[0];
		return theme.colors;
	}

	private updateMahBackground(pattern?: string): void {
		this.backgroundUrl.set('');
		if (!pattern) {
			return;
		}
		this.patternService
			.svgDataUrl(pattern, this.cssBarColors())
			.then(dataUrl => this.backgroundUrl.set(dataUrl))
			.catch(error => log.error(error));
	}

	private updateBackground(background: string): void {
		const bg = Backgrounds.find(b => b.img === background);
		if (!bg?.img) {
			this.backgroundUrl.set(undefined);
			this.backgroundRepeat.set(false);
			return;
		}
		this.backgroundRepeat.set(!!bg.repeat);
		if (bg.type === 'MAH') {
			this.updateMahBackground(this.pattern());
			return;
		}
		this.backgroundUrl.set(`url("assets/img/${bg.img}.${(bg.type ?? 'jpg')}")`);
	}
}
