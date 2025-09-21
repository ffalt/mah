import type { Mapping } from '../types';
import { type BaseLayerOptions, X_MAX, Y_MAX } from './consts';
import { generateBaseLayerChecker } from './base-layer-checker';
import { generateBaseLayerLines } from './base-layer-lines';
import { generateBaseLayerRings } from './base-layer-rings';
import { generateBaseLayerAreas } from './base-layer-areas';
import { blocksOverlap, inBounds, key } from './utilities';

function mirrorBaseLayer(mirrorX: boolean, mirrorY: boolean, baseLayer: Mapping): Mapping {
	if ((!mirrorX && !mirrorY) || baseLayer.length === 0) {
		return baseLayer;
	}

	// Determine extents of the provided base layer (typically z=0)
	const usedX = Math.max(...baseLayer.map(p => p[1]));
	const usedY = Math.max(...baseLayer.map(p => p[2]));

	// Choose mirror frames deterministically to preserve even-even parity and ensure a gap >= 2.
	// We want xMax and yMax to be even so that mirroring maps even -> even, avoiding 1-step adjacency.
	const minRequiredXMax = usedX * 2 + 2; // ensures axis >= usedX + 1 => gap >= 2
	const minRequiredYMax = usedY * 2 + 2;
	let xMax = Math.min(X_MAX, minRequiredXMax + 4); // allow a small buffer but keep within bounds
	let yMax = Math.min(Y_MAX, minRequiredYMax + 4);
	// enforce even
	if (xMax % 2 !== 0) {
		xMax--;
	}
	if (yMax % 2 !== 0) {
		yMax--;
	}
	// if clamping made it too small, fall back to the minimum possible even frame
	if (xMax < minRequiredXMax) {
		xMax = Math.max(usedX * 2, Math.min(X_MAX - (X_MAX % 2), minRequiredXMax));
	}
	if (yMax < minRequiredYMax) {
		yMax = Math.max(usedY * 2, Math.min(Y_MAX - (Y_MAX % 2), minRequiredYMax));
	}

	const mirXf = (x: number) => xMax - x;
	const mirYf = (y: number) => yMax - y;

	// Build a set for fast duplicate/overlap checks at z=0 (base layer)
	const mapping: Mapping = [...baseLayer];
	const present = new Set<string>(mapping.map(([z, x, y]) => key(z, x, y)));

	// Helper to attempt adding a mirrored coordinate with safety checks
	const tryAddMirror = (z: number, x: number, y: number) => {
		if (!inBounds(x, y, z)) {
			return;
		}
		const k0 = key(z, x, y);
		if (present.has(k0)) {
			return;
		}
		if (blocksOverlap(present, z, x, y)) {
			return;
		}
		present.add(k0);
		mapping.push([z, x, y]);
	};

	// Mirror across X if requested
	if (mirrorX) {
		const snapshot = [...mapping];
		for (const [z, x, y] of snapshot) {
			const mx = mirXf(x);
			if (mx === x) {
				continue; // on mirror axis
			}
			tryAddMirror(z, mx, y);
		}
	}

	// Mirror across Y if requested (after applying X-mirror above)
	if (mirrorY) {
		const snapshot = [...mapping];
		for (const [z, x, y] of snapshot) {
			const my = mirYf(y);
			if (my === y) {
				continue; // on mirror axis
			}
			tryAddMirror(z, x, my);
		}
	}
	return mapping;
}

function splitArea(baseMin: number, baseMax: number, mirrorX: boolean, mirrorY: boolean): BaseLayerOptions {
	const both = mirrorX && mirrorY;
	const either = (mirrorX && !mirrorY) || (!mirrorX && mirrorY);
	let factor: number;
	if (both) {
		factor = 0.25;
	} else if (either) {
		factor = 0.5;
	} else {
		factor = 1;
	}
	const minTarget = Math.max(1, Math.floor(baseMin * factor));
	const maxTarget = Math.max(minTarget, Math.floor(baseMax * factor));
	const xMax = mirrorX ? Math.floor(X_MAX / 2) : X_MAX;
	const yMax = mirrorY ? Math.floor(Y_MAX / 2) : Y_MAX;
	return { minTarget, maxTarget, xMax, yMax };
}

export function generateBaseLayer(mirrorX: boolean, mirrorY: boolean, mode: string): Mapping {
	if (mode === 'checker') {
		const { minTarget, maxTarget } = splitArea(70, 120, mirrorX, mirrorY);
		const xRangeMin = mirrorX ? 7 : 14;
		const xRangeMax = mirrorX ? Math.floor(X_MAX / 2) : X_MAX;
		const yRangeMin = mirrorY ? 6 : 12;
		const yRangeMax = mirrorY ? Math.floor(Y_MAX / 2) : Y_MAX;
		// choose extents favoring mid-size boards
		const xMax = Math.floor(Math.random() * (xRangeMax - xRangeMin + 1)) + xRangeMin;
		const yMax = Math.floor(Math.random() * (yRangeMax - yRangeMin + 1)) + yRangeMin;
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerChecker({ minTarget, maxTarget, xMax, yMax }));
	}
	if (mode === 'lines') {
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerLines(splitArea(60, 80, mirrorX, mirrorY)));
	}
	if (mode === 'rings') {
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerRings(splitArea(70, 120, mirrorX, mirrorY)));
	}
	if (mode === 'areas') {
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerAreas(splitArea(60, 100, mirrorX, mirrorY)));
	}
	throw new Error('Invalid mode');
}
