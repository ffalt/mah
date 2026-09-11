import { CHALLENGE_CODES, type CHALLENGE_ID } from '../consts';
import type { ChallengeContext } from '../types';
import { ReachTargetRules } from './reach-target.base';

const DEFAULT_TARGET = 30;

export class ThirtyInThreeRules extends ReachTargetRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE;

	protected current(context: ChallengeContext): number {
		return context.score.matches();
	}

	protected target(context: ChallengeContext): number {
		return context.info.matchTarget ?? DEFAULT_TARGET;
	}
}
