import { CompactMapping, CompactMappingX, CompactMappingY, Mapping, Place } from './types';

export function expandMapping(map: CompactMapping): Mapping {
	const result: Mapping = [];
	map.forEach(matrix => {
		const z = matrix[0] as number;
		const rows = matrix[1] as Array<CompactMappingY>;
		rows.forEach(row => {
			const y = row[0] as number;
			const cells = row[1] as CompactMappingX;
			if (!Array.isArray(cells)) {
				result.push([z, cells, y]);
			} else {
				cells.forEach(cell => {
					if (Array.isArray(cell)) {
						let x = cell[0];
						const count = cell[1];
						for (let i = 0; i < count; i++) {
							result.push([z, x, y]);
							x += 2;
						}
					} else {
						result.push([z, cell, y]);
					}
				});
			}
		});
	});
	return result;
}

function hashString(s: string): number {
	let hash = 0;
	let i: number;
	let chr: number;
	if (s.length === 0) {
		return hash;
	}
	for (i = 0; i < s.length; i++) {
		chr = s.charCodeAt(i);
		// eslint-disable-next-line no-bitwise
		hash = ((hash << 5) - hash) + chr;
		// eslint-disable-next-line no-bitwise
		hash |= 0; // Convert to 32bit integer
	}
	return hash + 2147483647;
}

export function mappingToID(mapping: Mapping): string {
	return hashString(JSON.stringify(mapping)).toString();
}

export function mappingBounds(mapping: Mapping, minLevel: number, minX: number, minY: number): { x: number; y: number; z: number } {
	const bound = { x: minX, y: minY, z: minLevel };
	mapping.forEach((place: Place) => {
		bound.z = Math.max(bound.z, place[0] + 1);
		bound.x = Math.max(bound.x, place[1] + 1);
		bound.y = Math.max(bound.y, place[2] + 1);
	});
	return bound;
}
