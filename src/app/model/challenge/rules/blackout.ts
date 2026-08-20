import { CHALLENGE_CODES, type CHALLENGE_ID } from '../consts';
import type { ChallengeRules } from '../types';

export class BlackoutRules implements ChallengeRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_BLACKOUT;

	onStart(): void {
		// nope
	}

	evaluate(): 'run' | 'won' | 'lost' {
		return 'run';
	}
}
