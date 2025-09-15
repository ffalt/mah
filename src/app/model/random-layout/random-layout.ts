import type { Mapping } from '../types';
import { optimizeMapping } from '../../modules/editor/model/import';
import { type RandomBaseLayerMode, type RandomSymmetry, TARGET_COUNT } from './consts';
import { getRandomMode } from './utilities';
import { generateBaseLayer } from './base-layer';
import { fillLayout } from './upper-layers';

// Random Mahjong layout generator that produces a mapping of exactly 144 places
// abiding by the following constraints:
// - Bounds: x in [0..36], y in [0..16], z in [0..5]
// - Uniqueness: each [z,x,y] at most once
// - Support: for z>0, supported by same (x,y) at z-1 or orthogonal neighbor at distance 1
// - Uses a 1-step grid for x and y

const maxMappingPasses = 100;

export function generateRandomMappingOne(mirrorX: boolean, mirrorY: boolean, mode: string): Mapping {
	const mapping = generateBaseLayer(mirrorX, mirrorY, mode);
	return fillLayout(mapping, mirrorX, mirrorY);
}

export function generateRandomMappingRaw(mirrorX: boolean, mirrorY: boolean, mode: string): Mapping {
	const mapping = generateBaseLayer(mirrorX, mirrorY, mode);
	for (let index = 0; index < maxMappingPasses; index++) {
		const filled = fillLayout(mapping, mirrorX, mirrorY);
		if (filled.length === TARGET_COUNT) {
			return filled;
		}
	}
	return [];
}

export function generateRandomMapping(
	mirrorX: RandomSymmetry, mirrorY: RandomSymmetry, mode: RandomBaseLayerMode
): Mapping {
	const symmetricX = mirrorX === 'random' ? Math.random() < 0.5 : (mirrorX === 'true');
	const symmetricY = mirrorY === 'random' ? Math.random() < 0.5 : (mirrorY === 'true');
	const baseLayerMode = mode === 'random' ? getRandomMode() : mode;
	let mapping: Mapping = [];
	let passes = 0;
	while (mapping.length === 0) {
		mapping = generateRandomMappingRaw(symmetricX, symmetricY, baseLayerMode);
		passes++;
		if (passes > maxMappingPasses) {
			return [];
		}
	}
	return optimizeMapping(mapping);
}
