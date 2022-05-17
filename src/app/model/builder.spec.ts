import {readFileSync} from 'fs';
import {Layout, LoadLayout} from './types';
import {expandMapping, mappingToID} from './import';
import {Builder} from './builder';

const filepath = './src/assets/data/boards.json';

const loadLayouts: Array<LoadLayout> = JSON.parse(readFileSync(filepath).toString());
const layouts: Array<Layout> = loadLayouts.map(o => {
	const mapping = expandMapping(o.map || []);
	return {id: o.id ? o.id : mappingToID(mapping), name: o.name, category: o.cat || 'Classic', mapping};
});

const expectNoBlankTiles = (mode: string, layout: Layout) => {
	const builder = new Builder();
	const fails = [];
	for (let i = 0; i < 100; i++) {
		const stones = builder.build(mode, layout.mapping) || [];
		const empty = stones.filter(stone => stone.v === 0 || !stone.img?.id);
		if (empty.length > 0) {
			fails.push(i);
		}
	}
	expect(fails.join(',')).toBe([].join(','));
};

describe('builder', () => {
	for (const layout of layouts) {
		describe(`Layout ${layout.name} ${layout.mapping.length}`, () => {
			it('with linear build should not have blank tiles', async () => {
				expectNoBlankTiles('MODE_LINEAR', layout);
			});
			it('with solvable build should not have blank tiles', async () => {
				expectNoBlankTiles('MODE_SOLVABLE', layout);
			});
			it('with random build should not have blank tiles', async () => {
				expectNoBlankTiles('MODE_RANDOM', layout);
			});
		});
	}
});
