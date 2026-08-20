import type { Stone } from '../../stone';
import { CHALLENGE_CODES, CHALLENGE_MIDAS_CLEAR_BONUS, type CHALLENGE_ID } from '../consts';
import type { ChallengeContext, ChallengeRules } from '../types';

const BURIED_SLICE = 0.34;

export function pickMidasStone(context: ChallengeContext): Stone | undefined {
	const open = context.board.stones().filter(stone => !stone.picked());
	if (open.length === 0) {
		return undefined;
	}
	const buried = open.filter(stone => stone.isBlocked());
	const candidates = (buried.length > 0 ? buried : open)
		.slice()
		.sort((a, b) => a.z - b.z);
	const limit = Math.max(1, Math.floor(candidates.length * BURIED_SLICE));
	return candidates[Math.floor(context.random() * limit)];
}

export class MidasMatchRules implements ChallengeRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH;

	onStart(context: ChallengeContext): void {
		const stone = pickMidasStone(context);
		if (!stone) {
			return;
		}
		context.mark(stone, 'midas');
	}

	onPick(context: ChallengeContext, a: Stone, b: Stone): void {
		const midas = context.markedStones('midas');
		if (midas.includes(a) || midas.includes(b)) {
			context.score.addBonus(context.board.count() * CHALLENGE_MIDAS_CLEAR_BONUS);
		}
	}

	evaluate(context: ChallengeContext): 'run' | 'won' | 'lost' {
		const midas = context.markedStones('midas');
		if (midas.length === 0) {
			return 'run';
		}
		return midas.every(stone => stone.picked()) ? 'won' : 'run';
	}
}
