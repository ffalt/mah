import {Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges} from '@angular/core';
import {Consts} from '../../model/consts';
import {Layout} from '../../model/layouts';
import {Stone} from '../../model/stone';
import {Draw, DrawPos} from '../../model/draw';
import {Backgrounds} from '../../model/consts';

interface Level {
	z: number;
	rows: Array<Array<number>>;
	showTiles: boolean;
}

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnChanges {
	@Input() public background: string;
	@Input() public imageSet: string;
	@Input() public level: Level;
	@Input() public tiles: Array<Stone>;
	@Input() public layout: Layout;
	@Input() public cellcolor: (z: number, x: number, y: number) => string;
	@Input() public cellclick: (cell: Draw) => void;
	@Input() public click: (stone: Stone) => void;
	public draw_stones: Array<Draw> = [];
	public draw_cells: Array<Draw> = [];
	public rotate = false;
	public w = 1470;
	public h = 960;
	public translate = '';
	public viewport = '0 0 1470 960';
	public emptySource = new Stone(0, 0, 0, 0, 0);

	private static calcPos(z: number, x: number, y: number): DrawPos {
		const pos = {
			x: ((Consts.tile_width + 2) * x / 2 - (8 * z)) + (Consts.tile_width / 2),
			y: ((Consts.tile_height + 2) * y / 2 - (8 * z)) + (Consts.tile_height / 2),
			z: y + Consts.mY * (x + Consts.mX * z),
			translate: ''
		};
		pos.translate = 'translate(' + pos.x + ',' + pos.y + ')';
		return pos;
	}

	constructor(private elementRef: ElementRef, public renderer: Renderer2) {
	}

	ngOnInit(): void {
	}

	private setViewPort(): void {
		const bounds = this.calcBounds();
		let b: Array<number>;
		if (this.rotate) {
			b = [-bounds[3] - Consts.tile_height, -bounds[0], bounds[3] + Consts.tile_height, bounds[2] + bounds[0] + Consts.tile_width + 40];
		} else {
			b = [bounds[0] - 40, bounds[1] - 20, bounds[2] + Consts.tile_height + 40, bounds[3] + Consts.tile_height + 20];
		}
		this.viewport = b.join(' ');
	}

	private calcBounds(): Array<number> {
		const m = Math.max(this.w, this.h);
		const bounds = [m, m, 0, 0];
		const draws = this.draw_stones.concat(this.draw_cells);
		draws.forEach((draw) => {
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
		this.setSort(stones.filter((stone: Stone) => {
			return (stone != null);
		}).map((stone: Stone): Draw => {
			return {
				z: stone.z,
				x: stone.x,
				y: stone.y,
				v: stone.v,
				visible: true,
				url: stone.img.id,
				pos: BoardComponent.calcPos(stone.z, stone.x, stone.y),
				source: stone
			};
		}));
		this.setViewPort();
	}

	private updateLevel(level: Level): void {
		this.draw_cells = [];
		if (!level || !level.rows) {
			return;
		}
		const stones: Array<Draw> = [];
		level.rows.forEach((row: Array<number>, x: number) => {
			row.forEach((value: number, y: number) => {
				const draw = {
					x: x,
					y: y,
					z: level.z,
					v: value,
					visible: true,
					pos: BoardComponent.calcPos(level.z, x, y),
					source: this.emptySource
				};
				this.draw_cells.push(draw);
				if (draw.v > 0) {
					stones.push(draw);
				}
			});
		});
		if (level.showTiles) {
			this.setSort(stones);
		} else {
			this.draw_stones = [];
		}
	}

	private updateLayout(layout: Layout): void {
		this.setSort(layout.mapping.map((row: Array<number>): Draw => {
			return {
				z: row[0],
				x: row[1],
				y: row[2],
				v: 0,
				visible: true,
				pos: BoardComponent.calcPos(row[0], row[1], row[2]),
				source: this.emptySource
			};
		}));
		this.setViewPort();
	}

	private updateBackground(background: string): void {
		const back = Backgrounds.find(b => b.img === background);
		if (back && back.img) {
			this.renderer.setStyle(this.elementRef.nativeElement, 'background-size', back.small ? 'auto, auto' : '100%, 100%');
			this.renderer.setStyle(this.elementRef.nativeElement, 'background-image', 'url("assets/img/' + back.img + '")');
		} else {
			this.renderer.setStyle(this.elementRef.nativeElement, 'background-image', null);
		}
	}

	public ngOnChanges(changes: SimpleChanges): void {
		if (changes['tiles']) {
			this.updateTiles(changes['tiles'].currentValue);
		}
		if (changes['layout']) {
			this.updateLayout(changes['layout'].currentValue);
		}
		if (changes['level']) {
			this.updateLevel(changes['level'].currentValue);
		}
		if (changes['background']) {
			this.updateBackground(changes['background'].currentValue);
		}
	}

	public onCellColor(draw: Draw): string {
		if (this.cellcolor) {
			return this.cellcolor(draw.z, draw.x, draw.y);
		}
		return '#fff';
	}

	public onCellClick(draw: Draw): void {
		if (this.cellclick) {
			this.cellclick(draw);
		}
	}

	public setSort(draw_stones: Array<Draw>): void {
		const sortToDraw = (draw: Draw) => {
			// if (!draw.source) {
				return draw.pos.z;
			// }
			// return (draw.source.hinted ? 100000 : 0) + (draw.source.selected ? 100000 : 0) + draw.pos.z;
		};
		this.draw_stones = draw_stones.sort((ad: Draw, bd: Draw) => {
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

	public onClick(draw?: Draw): void {
		if (this.click) {
			if (draw) {
				this.click(draw.source);
				// this.setSort(this.draw_stones); // trigger a resort for z-ordering in svg
			} else {
				this.click(null);
				// this.setSort(this.draw_stones); // trigger a resort for z-ordering in svg
			}
		}
	}

	public onResize(event: { target: { innerHeight: number, innerWidth: number } }): void {
		if (this.cellcolor) {
			return;
		}
		const element = event.target;
		const r = element.innerHeight > element.innerWidth;
		if (r !== this.rotate) {
			this.rotate = r;
			if (this.rotate) {
				this.translate = 'rotate(90)';
			} else {
				this.translate = '';
			}
			this.setViewPort();
		}
	}
}
