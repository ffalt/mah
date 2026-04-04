import type { Mapping } from '../types';
import { type CellsFunction, generateBaseLayerWithShapes, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';
import { crossCells } from './base-layer-cross';
import { diamondCells } from './base-layer-diamond';
import { triangleCells } from './base-layer-triangle';
import { areaCells } from './base-layer-areas';
import { ringPerimeter } from './base-layer-rings';

const shapeFunctions: Array<CellsFunction> = [crossCells, diamondCells, triangleCells, areaCells, ringPerimeter];

export function generateBaseLayerShapes(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	for (let w = 3; w <= 9; w++) {
		for (let h = 3; h <= 9; h++) {
			allSizes.push([w, h]);
		}
	}
	shuffleArray(allSizes);
	const mixedCells: CellsFunction = (x0, y0, w, h) => {
		const shapeCells = shapeFunctions[Math.floor(Math.random() * shapeFunctions.length)];
		return shapeCells(x0, y0, w, h);
	};
	return generateBaseLayerWithShapes(allSizes, mixedCells, options);
}
