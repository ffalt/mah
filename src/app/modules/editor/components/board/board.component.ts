import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Stone } from '../../../../model/stone';
import { Draw, DrawPos, getDrawViewPort, sortDrawItems } from '../../../../model/draw';
import { Consts } from '../../../../model/consts';
import { Matrix } from '../../model/matrix';

interface Level {
	z: number;
	rows: Array<Array<number>>;
	showStones?: boolean;
}

@Component({
    selector: 'app-editor-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    standalone: false
})
export class BoardComponent implements OnInit, OnChanges {
	@Input() imageSet: string;
	@Input() level: Level;
	@Input() matrix: Matrix;
	@Input() isBoard: boolean;
	@Output() readonly clickBoardEvent = new EventEmitter();
	@Output() readonly clickDrawEvent = new EventEmitter<Draw>();
	@Output() readonly clickStoneEvent = new EventEmitter<Stone | undefined>();
	drawStones: Array<Draw> = [];
	drawCells: Array<Draw> = [];
	rotate: boolean = false;
	translate: string = '';
	viewport: string = '0 0 1470 960';
	emptySource: Stone = new Stone(0, 0, 0, 0, 0);

	ngOnInit(): void {
		if (this.level) {
			this.updateLevel(this.level);
		}
	}

	drawClass(z: number, x: number, y: number): string {
		let s = '';
		if (!this.matrix.inBounds(z, x, y)) {
			s = 'invalid';
		}
		if (this.matrix.isTile(z, x, y) || this.matrix.isTilePosBlocked(z, x, y)) {
			s = 'tile';
		}
		if (this.matrix.isTilePosInvalid(z, x, y)) {
			s = 'blocked';
		}
		if (z > 0 && (this.matrix.isTile(z - 1, x, y) || this.matrix.isTilePosBlocked(z - 1, x, y))) {
			s += ' below';
		}
		return s;
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.level) {
			this.updateLevel(changes.level.currentValue);
		}
	}

	onClickStone(event: MouseEvent, draw?: Draw): void {
		this.clickStoneEvent.emit(draw?.source);
		event.stopPropagation();
	}

	onClickBoard(event: MouseEvent): void {
		this.clickBoardEvent.emit();
	}

	onClickDraw(event: MouseEvent, draw: Draw): void {
		this.clickDrawEvent.emit(draw);
		event.stopPropagation();
	}

	private calcDrawPos(z: number, x: number, y: number): DrawPos {
		const pos = {
			x: ((Consts.tileWidth + 2) * x / 2) + 4,
			y: ((Consts.tileHeight + 2) * y / 2) + 4,
			z: y + Consts.mY * (x + Consts.mX * z),
			translate: ''
		};
		pos.translate = `translate(${pos.x},${pos.y})`;
		return pos;
	}

	private updateLevel(level: Level): void {
		this.drawCells = [];
		this.drawStones = [];
		if (!level || !level.rows) {
			return;
		}
		const stones: Array<Draw> = [];
		level.rows.forEach((row: Array<number>, x: number) => {
			row.forEach((value: number, y: number) => {
				const draw: Draw = {
					x,
					y,
					z: level.z,
					v: value,
					visible: true,
					pos: this.calcDrawPos(level.z, x, y),
					className: this.drawClass(level.z, x, y),
					source: value > 0 ? new Stone(level.z, x, y, value, 0) : this.emptySource
				};
				this.drawCells.push(draw);
				if (draw.v > 0) {
					stones.push(draw);
				}
			});
		});
		this.drawStones = sortDrawItems(stones);
		this.viewport = getDrawViewPort(this.drawCells, 1470, 960, false);
	}

}
