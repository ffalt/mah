import { CONSTS } from './consts';
import type { Mapping } from './types';

export interface DrawPos {
	x: number;
	y: number;
	w: number;
	h: number;
	translate: string;
}

export interface DrawPlacement {
	x: number;
	y: number;
	z: number;
	pos: DrawPos;
}

export function calcDrawPos(z: number, x: number, y: number): DrawPos {
	const pos = {
		x: ((CONSTS.tileWidth + 2) * x - (z * CONSTS.levelOffset)) / 2,
		y: ((CONSTS.tileHeight + 2) * y - (z * CONSTS.levelOffset)) / 2,
		w: (CONSTS.tileWidth + 2) + (z * CONSTS.levelOffset),
		h: (CONSTS.tileHeight + 2) + (z * CONSTS.levelOffset),
		translate: ''
	};
	pos.translate = `translate(${pos.x},${pos.y})`;
	return pos;
}

export function sortDrawItems<T extends DrawPlacement>(items: Array<T>): Array<T> {
	return items.sort((ad: T, bd: T) => (ad.z - bd.z) || ((ad.x + ad.y) - (bd.x + bd.y)) || (ad.x - bd.x));
}

export function getDrawBoundsViewportBounds(bounds: Array<number>): Array<number> {
	const border = 20;
	return [
		bounds[0] - border,
		bounds[1] - border,
		bounds[2] - bounds[0] + (border * 2),
		bounds[3] - bounds[1] + (border * 2)
	];
}

export function getDrawBoundsViewport(bounds: Array<number>): string {
	return getDrawBoundsViewportBounds(bounds).join(' ');
}

export function getDrawViewport(items: Array<DrawPlacement>): string {
	const bounds = getDrawBounds(items);
	return getDrawBoundsViewport(bounds);
}

export function getDrawBounds(items: Array<DrawPlacement>): Array<number> {
	if (items.length === 0) {
		return [0, 0, 0, 0];
	}
	const bounds = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
	for (const draw of items) {
		bounds[0] = Math.min(bounds[0], draw.pos.x);
		bounds[1] = Math.min(bounds[1], draw.pos.y);
		bounds[2] = Math.max(bounds[2], draw.pos.x + draw.pos.w);
		bounds[3] = Math.max(bounds[3], draw.pos.y + draw.pos.h);
	}
	return bounds;
}

export function mappingToDrawPlacements(mapping: Mapping): Array<DrawPlacement> {
	const result = mapping.map(([z, x, y]): DrawPlacement => ({ z, x, y, pos: calcDrawPos(z, x, y) }));
	return sortDrawItems(result);
}
