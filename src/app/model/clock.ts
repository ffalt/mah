import { signal } from '@angular/core';

export type TimeSource = () => number;

const monotonicTime: TimeSource = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

export class Clock {
	readonly elapsed = signal(0);
	onStep?: () => void;
	private lastTime = 0;
	private timer?: ReturnType<typeof setTimeout> = undefined;

	constructor(private readonly now: TimeSource = monotonicTime) {
	}

	reset(): void {
		this.clearTimer();
		this.lastTime = 0;
		this.elapsed.set(0);
	}

	run(): void {
		if (this.timer !== undefined) {
			return;
		}
		this.lastTime = this.now();
		this.timer = setTimeout(() => {
			this.step();
		}, 1000);
	}

	pause(): void {
		if (this.timer === undefined) {
			return;
		}
		this.clearTimer();
		this.elapsed.update(value => value + this.since(this.now()));
	}

	current(): number {
		return Math.round(this.timer === undefined ? this.elapsed() : this.elapsed() + this.since(this.now()));
	}

	private step(): void {
		const now = this.now();
		this.elapsed.update(value => value + this.since(now));
		this.lastTime = now;
		this.clearTimer();
		this.timer = setTimeout(() => {
			this.step();
		}, 1000);
		this.onStep?.();
	}

	private since(now: number): number {
		return Math.max(0, now - this.lastTime);
	}

	private clearTimer(): void {
		if (this.timer === undefined) {
			return;
		}

		clearTimeout(this.timer);
		this.timer = undefined;
	}
}
