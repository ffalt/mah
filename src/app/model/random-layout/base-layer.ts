import type { Mapping } from '../types';
import { BaseLayerOptions, X_MAX, Y_MAX } from './consts';
import { generateBaseLayerChecker } from './base-layer-checker';
import { generateBaseLayerLines } from './base-layer-lines';
import { generateBaseLayerRings } from './base-layer-rings';
import { generateBaseLayerAreas } from './base-layer-areas';

function mirrorBaseLayer(mirrorX: boolean, mirrorY: boolean, baseLayer: Mapping): Mapping {
	if ((!mirrorX && !mirrorY) || baseLayer.length === 0) {
		return baseLayer;
	}

	const usedX = Math.max(...baseLayer.map(p => p[1]));
	const usedY = Math.max(...baseLayer.map(p => p[2]));

	const spaceX = Math.min(4, X_MAX - (usedX * 2));
	const spaceY = Math.min(4, Y_MAX - (usedY * 2));

	const xMax = usedX * 2 + Math.floor(Math.random() * spaceX) + 2;
	const yMax = usedY * 2 + Math.floor(Math.random() * spaceY) + 2;

	const mirX = (x: number) => xMax - x;
	const mirY = (y: number) => yMax - y;

	let mapping: Mapping = [...baseLayer];

	let mirrored: Mapping = [];
	if (mirrorX) {
		for (const [z, x, y] of mapping) {
			const mx = mirX(x);
			if (mx === x) {
				continue;
			} // centerline, nothing to add
			mirrored.push([z, mx, y]);
		}
		mapping = [...mapping, ...mirrored];
	}

	mirrored = [];
	if (mirrorY) {
		for (const [z, x, y] of mapping) {
			const my = mirY(y);
			if (my === y) {
				continue;
			} // centerline, nothing to add
			mirrored.push([z, x, my]);
		}
		mapping = [...mapping, ...mirrored];
	}
	return mapping;
}

function splitArea(baseMin: number, baseMax: number, mirrorX: boolean, mirrorY: boolean): BaseLayerOptions {
	const both = mirrorX && mirrorY;
	const either = (mirrorX && !mirrorY) || (!mirrorX && mirrorY);
	const factor = both ? 0.3 : (either ? 0.5 : 1);
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
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerLines(splitArea(60, 100, mirrorX, mirrorY)));
	}
	if (mode === 'rings') {
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerRings(splitArea(70, 120, mirrorX, mirrorY)));
	}
	if (mode === 'areas') {
		return mirrorBaseLayer(mirrorX, mirrorY, generateBaseLayerAreas(splitArea(60, 100, mirrorX, mirrorY)));
	}
	throw new Error('Invalid mode');
}
