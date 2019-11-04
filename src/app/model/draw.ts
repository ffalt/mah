import {Consts} from './consts';
import { Mapping} from './layouts';
import {Stone} from './stone';

export interface DrawPos {
	x: number;
	y: number;
	z: number;
	translate: string;
}

export interface Draw {
	x: number;
	y: number;
	z: number;
	v: number;
	pos: DrawPos;
	visible: boolean;
	url?: string;
	color?: string;
	source: Stone;
}

export function calcDrawPos(z: number, x: number, y: number): DrawPos {
	const pos = {
		x: ((Consts.tile_width + 2) * x / 2 - (z * 8)) + (Consts.tile_width / 2),
		y: ((Consts.tile_height + 2) * y / 2 - (z * 8)) + (Consts.tile_height / 2),
		z: y + Consts.mY * (x + Consts.mX * z),
		translate: ''
	};
	pos.translate = `translate(${pos.x},${pos.y})`;
	return pos;
}

export function sortDrawItems(items: Array<Draw>): Array<Draw> {
	const sortToDraw = (draw: Draw) => draw.pos.z;
	return items.sort((ad: Draw, bd: Draw) => {
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

export function getDrawViewPort(items: Array<Draw>, width: number, height: number, rotate: boolean): string {
	const bounds = getDrawBounds(items, width, height);
	const b: Array<number> = rotate ?
		[-bounds[3] - Consts.tile_height - 10, -bounds[0] - 30, bounds[3] + Consts.tile_height - 10, bounds[2] + bounds[0] + Consts.tile_width + 40] :
		[bounds[0] - 40, bounds[1] - 20, bounds[2] + Consts.tile_height + 40, bounds[3] + Consts.tile_height + 20];
	return b.join(' ');
}

export function getDrawBounds(items: Array<Draw>, width: number, height: number): Array<number> {
	const m = Math.max(width, height);
	const bounds = [m, m, 0, 0];
	items.forEach(draw => {
		bounds[0] = Math.min(bounds[0], draw.pos.x);
		bounds[1] = Math.min(bounds[1], draw.pos.y);
		bounds[2] = Math.max(bounds[2], draw.pos.x);
		bounds[3] = Math.max(bounds[3], draw.pos.y);
	});
	return bounds;
}

export function mappingToDrawItems(mapping: Mapping): Array<Draw> {
	const emptySource: Stone = new Stone(0, 0, 0, 0, 0);
	const result = mapping.map((row: Array<number>): Draw =>
		({
			z: row[0],
			x: row[1],
			y: row[2],
			v: 0,
			visible: true,
			pos: calcDrawPos(row[0], row[1], row[2]),
			source: emptySource
		}));
	return sortDrawItems(result);
}
