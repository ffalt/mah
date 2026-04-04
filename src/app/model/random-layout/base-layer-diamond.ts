import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';

// Diamond (rotated-square) outline inscribed in a bounding box of (w × h) tiles.
// w and h must be odd so the center and vertices land on even-coordinate grid points.
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
		const dxMax = Math.round(rx * (1 - Math.abs(dyStep) / ry));
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

// Diamond (rotated-square) filled inscribed in a bounding box of (w × h) tiles.
function diamondFilledCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const cx = x0 + Math.floor(w / 2) * 2;
	const cy = y0 + Math.floor(h / 2) * 2;
	const rx = Math.floor(w / 2);
	const ry = Math.floor(h / 2);
	const cells: Array<[number, number]> = [];

	for (let dyStep = -ry; dyStep <= ry; dyStep++) {
		const dxMax = Math.round(rx * (1 - Math.abs(dyStep) / ry));
		const y = cy + dyStep * 2;
		for (let dxStep = -dxMax; dxStep <= dxMax; dxStep++) {
			cells.push([cx + dxStep * 2, y]);
		}
	}
	return cells;
}

export function diamondCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const diamond = Math.random() < 0.5 ? diamondOutlineCells : diamondFilledCells;
	return diamond(x0, y0, w, h);
}

export function generateBaseLayerDiamond(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	// Square diamonds (w === h, odd sizes 3..11)
	for (let s = 3; s <= 11; s += 2) {
		allSizes.push([s, s]);
	}
	// Asymmetric diamonds for denser packing
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
