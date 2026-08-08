import type { Mapping, Place } from './types';
import { Solver } from './solver/solver';
import { Builder, MODE_SOLVABLE } from './builder';
import { Tiles } from './tiles';
import type { StonePosition } from './stone';

export const MAX_PROGRESS_REPORTS = 100;

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
	const step = Math.max(1, Math.ceil(rounds / MAX_PROGRESS_REPORTS));
	for (let index = 0; index < rounds; index++) {
		const stones = builder.build(MODE_SOLVABLE, mapping);
		if (stones) {
			if (solver.solveLayout(stones) > 0) {
				fail++;
			} else {
				won++;
			}
			if ((index + 1) % step === 0) {
				progress([won, fail]);
			}
		}
	}
	finish([won, fail]);
}
