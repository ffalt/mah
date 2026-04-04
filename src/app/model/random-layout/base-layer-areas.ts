import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';

export function areaCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const x1 = x0 + (w - 1) * 2;
	const y1 = y0 + (h - 1) * 2;
	const cells: Array<[number, number]> = [];
	for (let y = y0; y <= y1; y += 2) {
		for (let x = x0; x <= x1; x += 2) {
			cells.push([x, y]);
		}
	}
	return cells;
}

export function generateBaseLayerAreas(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	for (let w = 2; w <= 5; w++) {
		for (let h = 2; h <= 5; h++) {
			allSizes.push([w, h]);
		}
	}
	shuffleArray(allSizes);
	return generateBaseLayerWithShapes(allSizes, areaCells, options);
}
