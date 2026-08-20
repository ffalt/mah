import type { Board } from '../board';
import type { Clock } from '../clock';
import type { Stone } from '../stone';
import type { Score } from './score';
import type { CHALLENGE_ID, ChallengeInfo, ChallengeVerdict, StoneMark } from './consts';

export interface ChallengeContext {
	readonly info: ChallengeInfo;
	readonly board: Board;
	readonly clock: Clock;
	readonly score: Score;

	random(): number;

	remaining(): number;

	addTime(ms: number): void;

	mark(stone: Stone, mark: StoneMark): void;

	clearMark(mark: StoneMark): void;

	markedStones(mark: StoneMark): ReadonlyArray<Stone>;

	setProgress(current: number, total: number): void;

	setSubject(subject?: string): void;
}

export interface ChallengeRules {
	readonly id: CHALLENGE_ID;

	onStart(context: ChallengeContext): void;

	onPick?(context: ChallengeContext, a: Stone, b: Stone): void;

	onUndo?(context: ChallengeContext): void;

	onRestore?(context: ChallengeContext): void;

	evaluate(context: ChallengeContext): ChallengeVerdict;
}
