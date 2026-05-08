import type { Stone } from './stone';
import type { Tiles } from './tiles';
import type { Mapping, StoneMapping } from './types';
import { SolvableBoardBuilder } from './builder/solvable';
import { SolvableBoardBuilderEasy } from './builder/solvable-easy';
import { SolvableBoardBuilderExpert } from './builder/solvable-expert';
import { RandomBoardBuilder } from './builder/random';
import { LoadBoardBuilder } from './builder/load';
import type { BuilderType } from './builder/base';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, type GAME_MODE_ID } from './consts';

export const MODE_SOLVABLE = 'MODE_SOLVABLE';
export const MODE_SOLVABLE_EASY = 'MODE_SOLVABLE_EASY';
export const MODE_SOLVABLE_EXPERT = 'MODE_SOLVABLE_EXPERT';
export const MODE_RANDOM = 'MODE_RANDOM';

export const BuilderModes = [
	{ id: MODE_SOLVABLE_EASY, builder: SolvableBoardBuilderEasy },
	{ id: MODE_SOLVABLE, builder: SolvableBoardBuilder },
	{ id: MODE_SOLVABLE_EXPERT, builder: SolvableBoardBuilderExpert },
	{ id: MODE_RANDOM, builder: RandomBoardBuilder }
];

export type BUILD_MODE_ID = 'MODE_SOLVABLE_EASY' | 'MODE_SOLVABLE' | 'MODE_SOLVABLE_EXPERT' | 'MODE_RANDOM';

export function solvableModeForGameMode(mode: GAME_MODE_ID): BUILD_MODE_ID {
	if (mode === GAME_MODE_EASY) {
		return MODE_SOLVABLE_EASY;
	}
	if (mode === GAME_MODE_EXPERT) {
		return MODE_SOLVABLE_EXPERT;
	}
	return MODE_SOLVABLE;
}

export class Builder {
	constructor(private readonly tiles: Tiles) {
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
		return undefined;
	}
}
