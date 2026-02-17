import type { Mapping } from '../../../model/types';

export function optimizeMapping(mapping: Mapping): Mapping {
	if (mapping.length === 0) {
		return [];
	}
	// move board to left/top/min z-index
	let minZ: number = mapping[0][0];
	let minX: number = mapping[0][1];
	let minY: number = mapping[0][2];
	for (const p of mapping) {
		minZ = Math.min(p[0], minZ);
		minX = Math.min(p[1], minX);
		minY = Math.min(p[2], minY);
	}
	return mapping.map(p => [p[0] - (minZ || 0), p[1] - (minX || 0), p[2] - (minY || 0)]);
}
