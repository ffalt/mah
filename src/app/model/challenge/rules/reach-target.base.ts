import type { CHALLENGE_ID } from '../consts';
import type { ChallengeContext, ChallengeRules } from '../types';

export abstract class ReachTargetRules implements ChallengeRules {
	abstract readonly id: CHALLENGE_ID;

	onStart(context: ChallengeContext): void {
		context.setProgress(0, this.target(context));
	}

	onRestore(context: ChallengeContext): void {
		this.updateProgress(context);
	}

	onPick(context: ChallengeContext): void {
		this.updateProgress(context);
	}

	onUndo(context: ChallengeContext): void {
		this.updateProgress(context);
	}

	evaluate(context: ChallengeContext): 'run' | 'won' | 'lost' {
		if (this.current(context) >= this.target(context)) {
			return 'won';
		}
		return context.remaining() <= 0 ? 'lost' : 'run';
	}

	protected abstract current(context: ChallengeContext): number;

	protected abstract target(context: ChallengeContext): number;

	private updateProgress(context: ChallengeContext): void {
		context.setProgress(this.current(context), this.target(context));
	}
}
