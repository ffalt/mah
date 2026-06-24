import type { Mapping, Place } from './types';
import { Solver } from './solver/solver';
import { Builder, MODE_SOLVABLE } from './builder';
import { Tiles } from './tiles';
import type { StonePosition } from './stone';

export function solveGame(stones: Array<StonePosition>, finish: (data: { result: number; order: Array<Place> }) => void, solver: Solver = new Solver()): void {
	const result = solver.solveLayout(stones);
	finish({ result, order: solver.writeGame() });
}

export function statsSolveMapping(
	mapping: Mapping,
	rounds: number,
	progress: (progress: Array<number>) => void,
	finish: (result: Array<number>) => void,
	solver: Solver = new Solver(),
	builder: Builder = new Builder(new Tiles(mapping.length))
): void {
	let fail = 0;
	let won = 0;
	for (let index = 0; index < rounds; index++) {
		const stones = builder.build(MODE_SOLVABLE, mapping);
		if (stones) {
			if (solver.solveLayout(stones) > 0) {
				fail++;
			} else {
				won++;
			}
			progress([won, fail]);
		}
	}
	finish([won, fail]);
}
