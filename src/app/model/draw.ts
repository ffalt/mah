import { CONSTS } from './consts';
import { Stone } from './stone';
import type { Mapping } from './types';

export interface DrawPos {
	x: number;
	y: number;
	w: number;
	h: number;
	sort: number;
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
	className?: string;
	source: Stone;
}

export function calcDrawPos(z: number, x: number, y: number): DrawPos {
	const pos = {
		x: ((CONSTS.tileWidth + 2) * x - (z * CONSTS.levelOffset)) / 2,
		y: ((CONSTS.tileHeight + 2) * y - (z * CONSTS.levelOffset)) / 2,
		w: (CONSTS.tileWidth + 2) + (z * CONSTS.levelOffset),
		h: (CONSTS.tileHeight + 2) + (z * CONSTS.levelOffset),
		sort: y + CONSTS.mY * (x + CONSTS.mX) * z,
		translate: ''
	};
	pos.translate = `translate(${pos.x},${pos.y})`;
	return pos;
}

export function sortDrawItems(items: Array<Draw>): Array<Draw> {
	return items.sort((ad: Draw, bd: Draw) => {
		const a = ad.pos.sort;
		const b = bd.pos.sort;
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	});
}

export function getDrawBoundsViewPortBounds(bounds: Array<number>): Array<number> {
	const border = 20;
	return [
		bounds[0] - border,
		bounds[1] - border,
		bounds[2] + (border * 2),
		bounds[3] + (border * 2)
	];
}

export function getDrawBoundsViewPort(bounds: Array<number>): string {
	return getDrawBoundsViewPortBounds(bounds).join(' ');
}

export function getDrawViewPort(items: Array<Draw>): string {
	const bounds = getDrawBounds(items);
	return getDrawBoundsViewPort(bounds);
}

export function getDrawBounds(items: Array<Draw>): Array<number> {
	if (items.length === 0) {
		return [0, 0, 0, 0];
	}
	const bounds = [5000, 5000, 0, 0];
	for (const draw of items) {
		bounds[0] = Math.min(bounds[0], draw.pos.x);
		bounds[1] = Math.min(bounds[1], draw.pos.y);
		bounds[2] = Math.max(bounds[2], draw.pos.x + draw.pos.w);
		bounds[3] = Math.max(bounds[3], draw.pos.y + draw.pos.h);
	}
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
