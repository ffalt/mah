import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, shuffleArray } from './utilities';
import { rng } from '../rng';
import type { BaseLayerOptions } from './consts';

function diamondRowRadius(rx: number, ry: number, dyStep: number): number {
	return ry === 0 ? rx : Math.round(rx * (1 - Math.abs(dyStep) / ry));
}

function diamondOutlineCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const cx = x0 + Math.floor(w / 2) * 2;
	const cy = y0 + Math.floor(h / 2) * 2;
	const rx = Math.floor(w / 2);
	const ry = Math.floor(h / 2);
	const seen = new Set<string>();
	const cells: Array<[number, number]> = [];

	const add = (x: number, y: number) => {
		const k = `${x}|${y}`;
		if (!seen.has(k)) {
			seen.add(k);
			cells.push([x, y]);
		}
	};

	for (let dyStep = -ry; dyStep <= ry; dyStep++) {
		const dxMax = diamondRowRadius(rx, ry, dyStep);
		const y = cy + dyStep * 2;
		if (dxMax === 0) {
			add(cx, y);
		} else {
			add(cx - dxMax * 2, y);
			add(cx + dxMax * 2, y);
		}
	}
	return cells;
}

function diamondFilledCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const cx = x0 + Math.floor(w / 2) * 2;
	const cy = y0 + Math.floor(h / 2) * 2;
	const rx = Math.floor(w / 2);
	const ry = Math.floor(h / 2);
	const cells: Array<[number, number]> = [];

	for (let dyStep = -ry; dyStep <= ry; dyStep++) {
		const dxMax = diamondRowRadius(rx, ry, dyStep);
		const y = cy + dyStep * 2;
		for (let dxStep = -dxMax; dxStep <= dxMax; dxStep++) {
			cells.push([cx + dxStep * 2, y]);
		}
	}
	return cells;
}

export function diamondCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const diamond = rng() < 0.5 ? diamondOutlineCells : diamondFilledCells;
	return diamond(x0, y0, w, h);
}

export function generateBaseLayerDiamond(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	for (let s = 3; s <= 11; s += 2) {
		allSizes.push([s, s]);
	}
	for (let w = 3; w <= 9; w += 2) {
		for (let h = 3; h <= 9; h += 2) {
			if (w !== h) {
				allSizes.push([w, h]);
			}
		}
	}
	shuffleArray(allSizes);
	return generateBaseLayerWithShapes(allSizes, diamondCells, options);
}
