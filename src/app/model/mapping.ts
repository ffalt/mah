import type { CompactMapping, CompactMappingX, Mapping, Place } from './types';
import { hashString } from './hash';

export function expandMapping(map: CompactMapping): Mapping {
	return map.flatMap(([z, rows]) =>
		rows.flatMap(([y, cells]) =>
			expandCells(z, y, cells)
		)
	);
}

function expandCells(z: number, y: number, cells: CompactMappingX): Array<Place> {
	// Handle single cell case
	if (!Array.isArray(cells)) {
		return [[z, cells, y]];
	}

	// Handle array of cells
	return cells.flatMap(cell =>
		Array.isArray(cell) ? expandRepeatedCells(z, y, cell[0], cell[1]) : [[z, cell, y]]
	);
}

function expandRepeatedCells(z: number, y: number, startX: number, count: number): Array<Place> {
	return Array.from(
		{ length: count },
		(_, index) => [z, startX + (index * 2), y] as Place
	);
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
