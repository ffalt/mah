import type { CompactMapping, Mapping } from './types';
import { hashString } from './hash';

export function expandMapping(map: CompactMapping): Mapping {
	const result: Mapping = [];
	for (const [z, rows] of map) {
		for (const [y, cells] of rows) {
			// Handle single cell case
			if (!Array.isArray(cells)) {
				result.push([z, cells, y]);
				continue;
			}
			// Handle array of cells
			for (const cell of cells) {
				if (Array.isArray(cell)) {
					// Repeated cells with pattern [startX, count]
					const [startX, count] = cell;
					for (let index = 0, x = startX; index < count; index++, x += 2) {
						result.push([z, x, y]);
					}
				} else {
					// Simple cell
					result.push([z, cell, y]);
				}
			}
		}
	}
	return result;
}

export function mappingToID(mapping: Mapping): string {
	return hashString(JSON.stringify(mapping)).toString();
}

export function mappingBounds(mapping: Mapping, minLevel: number, minX: number, minY: number): { x: number; y: number; z: number } {
	const bound = { x: minX, y: minY, z: minLevel };
	for (const place of mapping) {
		bound.z = Math.max(bound.z, place[0] + 1);
		bound.x = Math.max(bound.x, place[1] + 1);
		bound.y = Math.max(bound.y, place[2] + 1);
	}
	return bound;
}
