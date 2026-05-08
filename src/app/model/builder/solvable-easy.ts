import { SolvableBoardBuilderBase, type BreadthConstraint } from './solvable';

// Easy solvable — always at least 4 open pairs (freestones.length >= 8)
export class SolvableBoardBuilderEasy extends SolvableBoardBuilderBase {
	protected override breadthConstraint(): BreadthConstraint {
		return { min: 8, max: Infinity };
	}
}
