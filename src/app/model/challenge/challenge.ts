import { computed, signal } from '@angular/core';
import type { Board } from '../board';
import type { Clock } from '../clock';
import { type Stone, safeGetStone } from '../stone';
import { mulberry32, stringToSeed } from '../rng';
import {
	CHALLENGE_CODES,
	type CHALLENGE_ID,
	type ChallengeInfo,
	type ChallengeMarkPlace,
	type ChallengeStateStore,
	type ChallengeVerdict,
	type StoneMark,
	baseTimeLimit,
	challengeInfo,
	markCode,
	markFromCode,
	suitGroupCode,
	suitGroupName
} from './consts';
import { Score } from './score';
import type { ChallengeContext, ChallengeRules } from './types';
import { MidasMatchRules } from './rules/midas-match';
import { SparkstoneRules } from './rules/sparkstone';
import { ThirtyInThreeRules } from './rules/thirty-in-three';
import { FortuneHuntRules } from './rules/fortune-hunt';
import { RunningSandRules } from './rules/running-sand';
import { PurgeRules } from './rules/purge';
import { BlackoutRules } from './rules/blackout';

export interface ChallengeSetup {
	id: CHALLENGE_ID;
	seed: string;
	dayKey?: string;
}

export function createChallengeRules(id: CHALLENGE_ID): ChallengeRules {
	switch (id) {
		case CHALLENGE_CODES.CHALLENGE_SPARKSTONE: {
			return new SparkstoneRules();
		}
		case CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE: {
			return new ThirtyInThreeRules();
		}
		case CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT: {
			return new FortuneHuntRules();
		}
		case CHALLENGE_CODES.CHALLENGE_RUNNING_SAND: {
			return new RunningSandRules();
		}
		case CHALLENGE_CODES.CHALLENGE_THE_PURGE: {
			return new PurgeRules();
		}
		case CHALLENGE_CODES.CHALLENGE_BLACKOUT: {
			return new BlackoutRules();
		}
		default: {
			return new MidasMatchRules();
		}
	}
}

export class Challenge implements ChallengeContext {
	readonly info: ChallengeInfo;
	readonly score = new Score();
	readonly progress = signal<{ current: number; total: number } | undefined>(undefined);
	readonly subject = signal<string | undefined>(undefined);
	readonly timeBonus = signal(0);
	readonly remainingTime = computed(() => this.timeLimit() - this.clock.elapsed());

	readonly id: CHALLENGE_ID;
	readonly seed: string;
	readonly dayKey?: string;

	private readonly rules: ChallengeRules;
	private readonly nextRandom: () => number;
	private readonly marks = new Map<StoneMark, Array<Stone>>();
	private draws = 0;

	constructor(setup: ChallengeSetup, readonly board: Board, readonly clock: Clock) {
		this.id = setup.id;
		this.seed = setup.seed;
		this.dayKey = setup.dayKey;
		this.info = challengeInfo(setup.id);
		this.rules = createChallengeRules(setup.id);
		this.nextRandom = mulberry32(stringToSeed(`${setup.seed}-${setup.id}`));
	}

	get hasTimeLimit(): boolean {
		return this.baseTimeLimit() !== undefined;
	}

	timeLimit(): number {
		const base = this.baseTimeLimit();
		return base === undefined ? Number.POSITIVE_INFINITY : base + this.timeBonus();
	}

	random(): number {
		this.draws++;
		return this.nextRandom();
	}

	remaining(): number {
		return this.remainingTime();
	}

	addTime(ms: number): void {
		this.timeBonus.update(value => value + ms);
	}

	mark(stone: Stone, mark: StoneMark): void {
		const previous = stone.mark();
		if (previous === mark) {
			return;
		}
		if (previous) {
			this.removeMarkedStone(stone, previous);
		}
		stone.mark.set(mark);
		const marked = this.marks.get(mark);
		if (marked) {
			marked.push(stone);
		} else {
			this.marks.set(mark, [stone]);
		}
	}

	clearMark(mark: StoneMark): void {
		const marked = this.marks.get(mark);
		if (!marked) {
			return;
		}
		for (const stone of marked) {
			stone.mark.set(undefined);
		}
		this.marks.delete(mark);
	}

	markedStones(mark: StoneMark): ReadonlyArray<Stone> {
		return this.marks.get(mark) ?? [];
	}

	setProgress(current: number, total: number): void {
		this.progress.set({ current, total });
	}

	setSubject(subject?: string): void {
		this.subject.set(subject);
	}

	start(): void {
		this.score.reset();
		this.timeBonus.set(0);
		this.progress.set(undefined);
		this.subject.set(undefined);
		this.rules.onStart(this);
	}

	pick(a: Stone, b: Stone): void {
		this.score.addMatch(this.clock.current(), Math.max(a.z, b.z));
		this.rules.onPick?.(this, a, b);
	}

	undo(): void {
		this.score.undoMatch();
		this.rules.onUndo?.(this);
	}

	hintUsed(): void {
		this.score.breakCombo();
	}

	evaluate(): ChallengeVerdict {
		return this.rules.evaluate(this);
	}

	save(): ChallengeStateStore {
		const score = this.score.save();
		return {
			code: this.id,
			seed: this.seed,
			dayKey: this.dayKey,
			score: score.points,
			matches: score.matches,
			combo: score.combo,
			lastMatchAt: score.lastMatchAt,
			timeBonus: this.timeBonus(),
			marks: this.saveMarks(),
			suit: this.saveSuit(),
			draws: this.draws,
			undoPoints: this.info.allowUndo ? score.history : undefined
		};
	}

	restore(store: ChallengeStateStore): void {
		for (let index = 0; index < (store.draws ?? 0); index++) {
			this.random();
		}
		this.score.load({
			points: store.score ?? 0,
			matches: store.matches ?? 0,
			combo: store.combo ?? 0,
			lastMatchAt: store.lastMatchAt,
			history: store.undoPoints ?? []
		});
		this.timeBonus.set(store.timeBonus ?? 0);
		this.subject.set(store.suit === undefined ? undefined : suitGroupName(store.suit));
		const marks = store.marks ?? [];
		for (const [z, x, y, code] of marks) {
			const stone = safeGetStone(this.board.stones(), z, x, y);
			const mark = markFromCode(code);
			if (stone && mark) {
				this.mark(stone, mark);
			}
		}
		this.rules.onRestore?.(this);
	}

	// stones() keeps picked stones, so a per-tile budget stays the same for the whole run
	private baseTimeLimit(): number | undefined {
		return baseTimeLimit(this.info, this.board.stones().length);
	}

	private removeMarkedStone(stone: Stone, mark: StoneMark): void {
		const marked = this.marks.get(mark);
		if (!marked) {
			return;
		}
		const index = marked.indexOf(stone);
		if (index !== -1) {
			marked.splice(index, 1);
		}
		if (marked.length === 0) {
			this.marks.delete(mark);
		}
	}

	private saveMarks(): Array<ChallengeMarkPlace> {
		const marks: Array<ChallengeMarkPlace> = [];
		for (const stone of this.board.stones()) {
			const mark = stone.mark();
			if (mark) {
				marks.push([stone.z, stone.x, stone.y, markCode(mark)]);
			}
		}
		return marks;
	}

	private saveSuit(): number | undefined {
		const subject = this.subject();
		return subject === undefined ? undefined : suitGroupCode(subject);
	}
}
