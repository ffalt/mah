import { readFileSync } from 'node:fs';
import type { LoadLayout } from './types';
import { expandMapping, mappingToID } from './mapping';
import { hashCode, hashString } from './hash';
import { describe, it, expect } from 'vitest';

const filepath = './src/assets/data/boards.json';

const loadLayouts: Array<LoadLayout> = JSON.parse(readFileSync(filepath).toString());

describe('hash ID', () => {
	describe.each(loadLayouts)('Layout $name', layout => {
		it('calculates the right hash ID', async () => {
			const mapping = expandMapping(layout.map || []);
			expect(layout.id).toBe(mappingToID(mapping));
		});
	});
});

describe('hashString', () => {
	it('produces a non-negative id for the ordinary case', () => {
		expect(hashString('a')).toBe(hashCode('a') + 2_147_483_647);
	});

	it('does not go negative for the one input whose hashCode is INT32_MIN', () => {
		const pathological = `WLGWAQ${String.fromCodePoint(32_469)}`;
		expect(hashCode(pathological)).toBe(-2_147_483_648);
		expect(hashString(pathological)).toBeGreaterThanOrEqual(0);
	});
});
