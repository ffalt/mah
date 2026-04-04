import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';

export function ringPerimeter(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const x1 = x0 + (w - 1) * 2;
	const y1 = y0 + (h - 1) * 2;
	const per: Array<[number, number]> = [];
	for (let x = x0; x <= x1; x += 2) {
		per.push([x, y0]);
	}
	for (let y = y0 + 2; y <= y1; y += 2) {
		per.push([x1, y]);
	}
	for (let x = x1 - 2; x >= x0; x -= 2) {
		per.push([x, y1]);
	}
	for (let y = y1 - 2; y > y0; y -= 2) {
		per.push([x0, y]);
	}
	return per;
}

export function generateBaseLayerRings(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	for (let w = 3; w <= 8; w++) {
		for (let h = 3; h <= 8; h++) {
			allSizes.push([w, h]);
		}
	}
	shuffleArray(allSizes);
	return generateBaseLayerWithShapes(allSizes, ringPerimeter, options);
}
