import { SolvableBoardBuilderBase, type BreadthConstraint } from './solvable';

// Expert solvable — at most 2 open pairs (freestones.length <= 4), more retries
export class SolvableBoardBuilderExpert extends SolvableBoardBuilderBase {
	protected override maxRuns = 10_000;

	protected override breadthConstraint(): BreadthConstraint {
		return { min: 2, max: 4 };
	}
}
