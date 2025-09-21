import { generateRandomMapping } from './random-layout';
import { isSupported } from './utilities';
import { RandomBaseLayerMode, RandomSymmetry } from './consts';

function hasFloatingTiles(mapping: Array<[number, number, number]>): Array<[number, number, number]> {
	const set = new Set(mapping.map(([z, x, y]) => `${z}|${x}|${y}`));
	const floats: Array<[number, number, number]> = [];
	for (const [z, x, y] of mapping) {
		if (z === 0) {
			continue;
		}
		const k = (zz: number, xx: number, yy: number) => `${zz}|${xx}|${yy}`;
		const z1 = z - 1;
		const direct = set.has(k(z1, x, y));
		const smallBridge = set.has(k(z1, x - 1, y)) && set.has(k(z1, x + 1, y));
		const largeBridge =
			set.has(k(z1, x - 1, y - 1)) &&
			set.has(k(z1, x + 1, y - 1)) &&
			set.has(k(z1, x - 1, y + 1)) &&
			set.has(k(z1, x + 1, y + 1));
		const supported = direct || smallBridge || largeBridge;
		if (!supported) {
			floats.push([z, x, y]);
		}
	}
	return floats;
}

function hasOverlap(mapping: Array<[number, number, number]>): Array<[[number, number, number], [number, number, number]]> {
	const byZ = new Map<number, Set<string>>();
	for (const [z, x, y] of mapping) {
		if (!byZ.has(z)) {
			byZ.set(z, new Set());
		}
		byZ.get(z)?.add(`${x}|${y}`);
	}
	const overlaps: Array<[[number, number, number], [number, number, number]]> = [];
	for (const [z, set] of byZ) {
		for (const key of set) {
			const [sx, sy] = key.split('|').map(Number);
			// All 8 neighboring positions around (sx,sy) on the same z are blocked
			const candidates: Array<[number, number]> = [
				[sx - 1, sy - 1], [sx, sy - 1], [sx + 1, sy - 1],
				[sx - 1, sy], /* center */ [sx + 1, sy],
				[sx - 1, sy + 1], [sx, sy + 1], [sx + 1, sy + 1]
			];
			for (const [nx, ny] of candidates) {
				if (set.has(`${nx}|${ny}`)) {
					overlaps.push([[z, sx, sy], [z, nx, ny]]);
				}
			}
		}
	}
	return overlaps;
}

describe('random-layout generator', () => {
	const runs = Array.from({ length: 100 }, (_, index) => index + 1);
	const mirrorSettings = ['true', 'false'];
	const modes: Array<RandomBaseLayerMode> = ['lines', 'checker', 'rings', 'areas'];
	describe.each(modes)('modes=%s', mode => {
		describe.each(mirrorSettings)('mirrorX=%s', mirrorX => {
			describe.each(mirrorSettings)('mirrorY=%s', mirrorY => {
				it.each(runs)('creates mappings with exactly 144 tiles (run #%s)', () => {
					const mapping = generateRandomMapping(mirrorX as RandomSymmetry, mirrorY as RandomSymmetry, mode);
					expect(mapping).toBeDefined();
					expect(Array.isArray(mapping)).toBe(true);
					expect(mapping).toHaveLength(144);
					// uniqueness and support sanity checks
					const set = new Set(mapping.map(([z, x, y]) => `${z}|${x}|${y}`));
					expect(set.size).toBe(144);
					for (const [z, x, y] of mapping) {
						expect(isSupported(set, z, x, y)).toBe(true);
					}
				});

				it.each(runs)('creates mappings without overlapping & floating (run #%s)', () => {
					const mapping = generateRandomMapping(mirrorX as RandomSymmetry, mirrorY as RandomSymmetry, mode);

					// explicit floating check for better diagnostics
					const floats = hasFloatingTiles(mapping);
					expect(floats).toHaveLength(0);

					// no overlapping tiles on the same level: (x,y) blocks (x+1,y), (x,y+1), (x+1,y+1)
					const overlaps = hasOverlap(mapping);
					expect(overlaps).toHaveLength(0);
				});
			});
		});
	});
});
