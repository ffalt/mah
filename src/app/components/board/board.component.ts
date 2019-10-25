import {Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Backgrounds, Consts} from '../../model/consts';
import {Draw, DrawPos} from '../../model/draw';
import {Layout} from '../../model/layouts';
import {Stone} from '../../model/stone';

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnChanges {
	@Input() background: string;
	@Input() imageSet: string;
	@Input() tiles: Array<Stone>;
	@Input() layout: Layout;
	@Output() readonly clickEvent = new EventEmitter<Stone>();
	@HostBinding('style.background-image') backgroundUrl: string | undefined;
	drawStones: Array<Draw> = [];
	rotate: boolean = false;
	w: number = 1470;
	h: number = 960;
	translate: string = '';
	viewport: string = '0 0 1470 960';
	prefix: string;
	urlPrefix: string;
	emptySource: Stone = new Stone(0, 0, 0, 0, 0);

	ngOnInit(): void {
		this.onResize({target: window});
	}

	trackByDrawStone(index: number, draw: Draw): string {
		return `${draw.source.groupnr}/${draw.source.v}`;
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.tiles) {
			this.updateTiles(changes.tiles.currentValue);
		}
		if (changes.layout) {
			this.updateLayout(changes.layout.currentValue);
		}
		if (changes.background) {
			this.updateBackground(changes.background.currentValue);
		}
		if (changes.imageSet) {
			this.prefix = `b_${changes.imageSet.currentValue}_`;
			this.urlPrefix = `#b_${changes.imageSet.currentValue}_`;
		}
	}

	setSort(stones: Array<Draw>): void {
		const sortToDraw = (draw: Draw) => draw.pos.z;
		this.drawStones = stones.sort((ad: Draw, bd: Draw) => {
			const a = sortToDraw(ad);
			const b = sortToDraw(bd);
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		});
	}

	onClick(draw?: Draw): void {
		this.clickEvent.emit(draw ? draw.source : undefined);
	}

	onResize(event: { target: { innerHeight: number, innerWidth: number } }): void {
		const element = event.target;
		const r = element.innerHeight > element.innerWidth;
		if (r !== this.rotate) {
			this.rotate = r;
			this.translate = this.rotate ? 'rotate(90)' : '';
			this.setViewPort();
		}
	}

	private static calcPos(z: number, x: number, y: number): DrawPos {
		const pos = {
			x: ((Consts.tile_width + 2) * x / 2 - (z * 8)) + (Consts.tile_width / 2),
			y: ((Consts.tile_height + 2) * y / 2 - (z * 8)) + (Consts.tile_height / 2),
			z: y + Consts.mY * (x + Consts.mX * z),
			translate: ''
		};
		pos.translate = `translate(${pos.x},${pos.y})`;
		return pos;
	}

	private setViewPort(): void {
		const bounds = this.calcBounds();
		const b: Array<number> = this.rotate ?
			[-bounds[3] - Consts.tile_height - 10, -bounds[0] - 30, bounds[3] + Consts.tile_height - 10, bounds[2] + bounds[0] + Consts.tile_width + 40] :
			[bounds[0] - 40, bounds[1] - 20, bounds[2] + Consts.tile_height + 40, bounds[3] + Consts.tile_height + 20];
		this.viewport = b.join(' ');
	}

	private calcBounds(): Array<number> {
		const m = Math.max(this.w, this.h);
		const bounds = [m, m, 0, 0];
		const draws = this.drawStones;
		draws.forEach(draw => {
			bounds[0] = Math.min(bounds[0], draw.pos.x);
			bounds[1] = Math.min(bounds[1], draw.pos.y);
			bounds[2] = Math.max(bounds[2], draw.pos.x);
			bounds[3] = Math.max(bounds[3], draw.pos.y);
		});
		return bounds;
	}

	private updateTiles(stones: Array<Stone>): void {
		if (!stones) {
			return;
		}
		this.setSort(stones
			.filter((stone: Stone) => (stone !== undefined))
			.map((stone: Stone): Draw =>
				({
					z: stone.z,
					x: stone.x,
					y: stone.y,
					v: stone.v,
					visible: true,
					url: stone.img.id,
					pos: BoardComponent.calcPos(stone.z, stone.x, stone.y),
					source: stone
				})));
		this.setViewPort();
	}

	private updateLayout(layout: Layout): void {
		this.setSort(layout.mapping.map((row: Array<number>): Draw =>
			({
				z: row[0],
				x: row[1],
				y: row[2],
				v: 0,
				visible: true,
				pos: BoardComponent.calcPos(row[0], row[1], row[2]),
				source: this.emptySource
			})));
		this.setViewPort();
	}

	private updateBackground(background: string): void {
		const back = Backgrounds.find(b => b.img === background);
		this.backgroundUrl = back && back.img ? `url("assets/img/${back.img}")` : undefined;
	}
}
