import {
	CHALLENGE_CODES,
	CHALLENGE_RUNNING_SAND_BONUS,
	CHALLENGE_RUNNING_SAND_COMBO_BONUS,
	CHALLENGE_RUNNING_SAND_MAX_RESERVE,
	type CHALLENGE_ID
} from '../consts';
import type { ChallengeContext, ChallengeRules } from '../types';

export class RunningSandRules implements ChallengeRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_RUNNING_SAND;

	onStart(): void {
		// nope
	}

	onPick(context: ChallengeContext): void {
		const bonus = context.info.timeBonus ?? CHALLENGE_RUNNING_SAND_BONUS;
		const combo = context.score.combo() > 0 ? CHALLENGE_RUNNING_SAND_COMBO_BONUS : 0;
		const room = CHALLENGE_RUNNING_SAND_MAX_RESERVE - context.remaining();
		context.addTime(Math.max(0, Math.min(bonus + combo, room)));
	}

	evaluate(context: ChallengeContext): 'run' | 'won' | 'lost' {
		return context.remaining() <= 0 ? 'lost' : 'run';
	}
}
