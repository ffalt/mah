import { Stone } from './stone';
import { Tiles } from './tiles';
import { Mapping, StoneMapping } from './types';
import { SolvableBoardBuilder } from './builder/solvable';
import { RandomBoardBuilder } from './builder/random';
import { LoadBoardBuilder } from './builder/load';
import { BuilderType } from './builder/base';

export const MODE_SOLVABLE = 'MODE_SOLVABLE';
export const MODE_RANDOM = 'MODE_RANDOM';

export const BuilderModes = [
	{ id: MODE_SOLVABLE, builder: SolvableBoardBuilder },
	{ id: MODE_RANDOM, builder: RandomBoardBuilder }
];

export type BUILD_MODE_ID = 'MODE_SOLVABLE' | 'MODE_RANDOM';

export class Builder {

	constructor(private tiles: Tiles) {
	}

	load(mapping: StoneMapping): Array<Stone> | undefined {
		const builder = new LoadBoardBuilder();
		return builder.build(mapping, this.tiles);
	}

	build(mode: BUILD_MODE_ID, mapping: Mapping): Array<Stone> | undefined {
		let builder: BuilderType | undefined;
		const builderMode = BuilderModes.find(m => m.id === mode);
		if (builderMode) {
			builder = new builderMode.builder();
		}
		if (builder) {
			return builder.build(mapping, this.tiles);
		}
		return;
	}
}
