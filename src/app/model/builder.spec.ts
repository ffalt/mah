import { readFileSync } from 'fs';
import { Layout, LoadLayout } from './types';
import { BUILD_MODE_ID, Builder } from './builder';
import { expandMapping, mappingToID } from './mapping';
import { Solver } from './solver';
import { Tiles } from './tiles';

const filepath = './src/assets/data/boards.json';

const loadLayouts: Array<LoadLayout> = JSON.parse(readFileSync(filepath).toString());
const layouts: Array<Layout> = loadLayouts.map(o => {
	const mapping = expandMapping(o.map || []);
	return { id: o.id ? o.id : mappingToID(mapping), name: o.name, category: o.cat || 'Classic', mapping };
});

const expectNoBlankTiles = (mode: BUILD_MODE_ID, layout: Layout) => {
	const builder = new Builder(new Tiles(layout.mapping.length));
	const fails: Array<number> = [];
	for (let i = 0; i < 100; i++) {
		const stones = builder.build(mode, layout.mapping) || [];
		const empty = stones.filter(stone => stone.v === 0 || !stone.img?.id);
		if (empty.length > 0) {
			fails.push(i);
		}
	}
	expect(fails.join(',')).toBe([].join(','));
};

const expectWinnable = (mode: BUILD_MODE_ID, layout: Layout) => {
	const builder = new Builder(new Tiles(layout.mapping.length));
	const unsolvable: Array<number> = [];
	for (let i = 0; i < 100; i++) {
		const stones = builder.build(mode, layout.mapping) || [];
		const solver = new Solver();
		const result = solver.solveLayout(stones);
		if (result > 0) {
			unsolvable.push(result);
		}
	}
	if (unsolvable.length) {
		console.log(`Fail "${mode}" "${layout.name}": ${unsolvable.join(',')}`);
	}
	expect(unsolvable.length).toBe(0);
};

describe('builder', () => {
	for (const layout of layouts) {
		describe(`Layout ${layout.name} ${layout.mapping.length}`, () => {
			it('with solvable build should not have blank tiles', async () => {
				expectNoBlankTiles('MODE_SOLVABLE', layout);
			});
			it('with solvable build should be solvable', async () => {
				expectWinnable('MODE_SOLVABLE', layout);
			});
			it('with random build should not have blank tiles', async () => {
				expectNoBlankTiles('MODE_RANDOM', layout);
			});
		});
	}
});
