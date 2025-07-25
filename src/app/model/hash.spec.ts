import { readFileSync } from 'node:fs';
import type { LoadLayout } from './types';
import { expandMapping, mappingToID } from './mapping';

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
