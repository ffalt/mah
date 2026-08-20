import type { Mapping } from '../types';
import { type RandomBaseLayerMode, type RandomSymmetry, TARGET_COUNT } from './consts';
import { getRandomMode, hasMultipleLevels } from './utilities';
import { resetRNG, rng, seedRNG } from '../rng';
import { generateBaseLayer } from './base-layer';
import { fillLayout } from './upper-layers';
import { optimizeMapping } from '../../modules/editor/model/optimize';

// Random Mahjong layout generator that produces a mapping of exactly 144 places
// abiding by the following constraints:
// - Bounds: x in [0..36], y in [0..16], z in [0..5]
// - Uniqueness: each [z,x,y] at most once
// - Support: for z>0, supported by same (x,y) at z-1 or orthogonal neighbor at distance 1
// - Uses a 1-step grid for x and y

const maxMappingPasses = 100;

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
	const symmetricX = mirrorX === 'random' ? rng() < 0.5 : (mirrorX === 'true');
	const symmetricY = mirrorY === 'random' ? rng() < 0.5 : (mirrorY === 'true');
	const baseLayerMode = mode === 'random' ? getRandomMode() : mode;
	let mapping: Mapping = [];
	let passes = 0;
	while (mapping.length !== 144 || !hasMultipleLevels(mapping)) {
		mapping = generateRandomMappingRaw(symmetricX, symmetricY, baseLayerMode);
		passes++;
		if (passes > maxMappingPasses) {
			return [];
		}
	}
	return optimizeMapping(mapping);
}

export const maxSeedAttempts = 100;

export function retrySeeded(seed: string, generate: () => Mapping): Mapping {
	for (let attempt = 0; attempt < maxSeedAttempts; attempt++) {
		seedRNG(attempt === 0 ? seed : `${seed}-${attempt}`);
		try {
			const mapping = generate();
			if (mapping.length > 0) {
				return mapping;
			}
		} finally {
			resetRNG();
		}
	}
	return [];
}

export function generateSeededRandomMapping(
	seed: string, mirrorX: RandomSymmetry, mirrorY: RandomSymmetry, mode: RandomBaseLayerMode
): Mapping {
	const mapping = retrySeeded(seed, () => generateRandomMapping(mirrorX, mirrorY, mode));
	if (mapping.length > 0 || (mirrorX === 'false' && mirrorY === 'false')) {
		return mapping;
	}
	return retrySeeded(`${seed}-unmirrored`, () => generateRandomMapping('false', 'false', mode));
}
