import type { Stone } from '../../stone';
import { CHALLENGE_CODES, CHALLENGE_SPARKSTONE_BONUS, CHALLENGE_SPARKSTONE_SCORE_BONUS, type CHALLENGE_ID } from '../consts';
import type { ChallengeContext, ChallengeRules } from '../types';

export function pickSparkStone(context: ChallengeContext): Stone | undefined {
	const open = context.board.stones().filter(stone => !stone.picked());
	if (open.length === 0) {
		return undefined;
	}
	const free = context.board.free();
	const pool = free.length > 0 ? free : open;
	return pool[Math.floor(context.random() * pool.length)];
}

export class SparkstoneRules implements ChallengeRules {
	readonly id: CHALLENGE_ID = CHALLENGE_CODES.CHALLENGE_SPARKSTONE;

	onStart(context: ChallengeContext): void {
		this.moveSpark(context);
	}

	onPick(context: ChallengeContext, a: Stone, b: Stone): void {
		const spark = context.markedStones('spark');
		if (!spark.includes(a) && !spark.includes(b)) {
			return;
		}
		context.addTime(context.info.timeBonus ?? CHALLENGE_SPARKSTONE_BONUS);
		context.score.addBonus(CHALLENGE_SPARKSTONE_SCORE_BONUS);
		this.moveSpark(context);
	}

	evaluate(context: ChallengeContext): 'run' | 'won' | 'lost' {
		return context.remaining() <= 0 ? 'lost' : 'run';
	}

	private moveSpark(context: ChallengeContext): void {
		context.clearMark('spark');
		const stone = pickSparkStone(context);
		if (stone) {
			context.mark(stone, 'spark');
		}
	}
}
