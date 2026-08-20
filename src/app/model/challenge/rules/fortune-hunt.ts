import { CHALLENGE_CODES, type CHALLENGE_ID } from '../consts';
import type { ChallengeContext, ChallengeRules } from '../types';

const DEFAULT_TARGET = 5000;

export class FortuneHuntRules implements ChallengeRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT;

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
		if (context.score.points() >= this.target(context)) {
			return 'won';
		}
		return context.remaining() <= 0 ? 'lost' : 'run';
	}

	private updateProgress(context: ChallengeContext): void {
		context.setProgress(context.score.points(), this.target(context));
	}

	private target(context: ChallengeContext): number {
		return context.info.scoreTarget ?? DEFAULT_TARGET;
	}
}
