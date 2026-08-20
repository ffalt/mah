import { signal } from '@angular/core';

export const SCORE_BASE_POINTS = 100;
export const SCORE_LAYER_BONUS = 15;
export const SCORE_COMBO_WINDOW = 5000;
export const SCORE_COMBO_STEPS = [1, 1.25, 1.5, 2, 3];

export interface ScoreStore {
	points: number;
	matches: number;
	combo: number;
	lastMatchAt?: number;
	history: Array<number>;
}

export class Score {
	readonly points = signal(0);
	readonly combo = signal(0);
	readonly matches = signal(0);

	private lastMatchAt?: number;
	private matchHistory: Array<number> = [];

	get multiplier(): number {
		const index = Math.min(this.combo(), SCORE_COMBO_STEPS.length - 1);
		return SCORE_COMBO_STEPS[index];
	}

	reset(): void {
		this.points.set(0);
		this.combo.set(0);
		this.matches.set(0);
		this.lastMatchAt = undefined;
		this.matchHistory = [];
	}

	addMatch(elapsed: number, layer: number): number {
		this.matchHistory.push(this.points());
		const inWindow = this.lastMatchAt !== undefined && (elapsed - this.lastMatchAt) <= SCORE_COMBO_WINDOW;
		this.combo.set(inWindow ? Math.min(this.combo() + 1, SCORE_COMBO_STEPS.length - 1) : 0);
		this.lastMatchAt = elapsed;
		this.matches.update(value => value + 1);
		const gained = Math.round((SCORE_BASE_POINTS + (layer * SCORE_LAYER_BONUS)) * this.multiplier);
		this.points.update(value => value + gained);
		return gained;
	}

	addBonus(points: number): void {
		this.points.update(value => value + Math.round(points));
	}

	undoMatch(): void {
		const before = this.matchHistory.pop();
		if (before === undefined) {
			return;
		}
		this.points.set(before);
		this.matches.update(value => Math.max(0, value - 1));
		this.breakCombo();
	}

	breakCombo(): void {
		this.combo.set(0);
		this.lastMatchAt = undefined;
	}

	history(): Array<number> {
		return [...this.matchHistory];
	}

	save(): ScoreStore {
		return {
			points: this.points(),
			matches: this.matches(),
			combo: this.combo(),
			lastMatchAt: this.lastMatchAt,
			history: this.history()
		};
	}

	load(store: ScoreStore): void {
		this.points.set(store.points);
		this.matches.set(store.matches);
		this.combo.set(store.combo);
		this.lastMatchAt = store.lastMatchAt;
		this.matchHistory = [...store.history];
	}
}
