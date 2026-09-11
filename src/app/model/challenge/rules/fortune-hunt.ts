import { CHALLENGE_CODES, type CHALLENGE_ID } from '../consts';
import type { ChallengeContext } from '../types';
import { ReachTargetRules } from './reach-target.base';

const DEFAULT_TARGET = 5000;

export class FortuneHuntRules extends ReachTargetRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT;

	protected current(context: ChallengeContext): number {
		return context.score.points();
	}

	protected target(context: ChallengeContext): number {
		return context.info.scoreTarget ?? DEFAULT_TARGET;
	}
}
