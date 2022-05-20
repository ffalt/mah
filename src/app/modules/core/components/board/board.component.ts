import {Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Backgrounds} from '../../../../model/consts';
import {calcDrawPos, Draw, getDrawViewPort, sortDrawItems} from '../../../../model/draw';
import {Stone} from '../../../../model/stone';
import {AppService} from '../../../../service/app.service';

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnChanges {
	@Input() background: string;
	@Input() imageSet: string;
	@Input() stones: Array<Stone>;
	@Output() readonly clickEvent = new EventEmitter<Stone>();
	@HostBinding('style.background-image') backgroundUrl: string | undefined;
	drawStones: Array<Draw> = [];
	rotate: boolean = false;
	translate: string = '';
	viewport: string = '0 0 1470 960';
	prefix: string;
	urlPrefix: string;

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

	onClick(event: MouseEvent, draw?: Draw): void {
		this.clickEvent.emit(draw ? draw.source : undefined);
		event.stopPropagation();
	}

	resize(element: { innerHeight: number; innerWidth: number }): void {
		const r = element.innerHeight > element.innerWidth;
		if (r !== this.rotate) {
			this.rotate = r;
			this.translate = this.rotate ? 'rotate(90)' : '';
			this.setViewPort();
		}
	}

	onResize(event: UIEvent): void {
		const element = event.target as Window;
		if (element) {
			this.resize(element);
		}
	}

	private setViewPort(): void {
		this.viewport = getDrawViewPort(this.drawStones, 1470, 960, this.rotate);
	}

	private updateStones(stones: Array<Stone>): void {
		if (!stones) {
			return;
		}
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
		this.drawStones = sortDrawItems(items);
		this.setViewPort();
	}

	private updateBackground(background: string): void {
		const back = Backgrounds.find(b => b.img === background);
		this.backgroundUrl = back && back.img ? `url("assets/img/${back.img}")` : undefined;
	}

}
