import { signal } from '@angular/core';

export class Clock {
	readonly elapsed = signal(0);
	private lastTime = 0;
	private timer?: ReturnType<typeof setTimeout> = undefined;

	reset(): void {
		this.clearTimer();
		this.lastTime = 0;
		this.elapsed.set(0);
	}

	run(): void {
		if (this.timer !== undefined) {
			return;
		}
		this.lastTime = Date.now();
		this.timer = setTimeout(() => {
			this.step();
		}, 1000);
	}

	pause(): void {
		if (this.timer === undefined) {
			return;
		}
		this.clearTimer();
		this.elapsed.update(value => value + (Date.now() - this.lastTime));
	}

	private step(): void {
		const newTime = Date.now();
		this.elapsed.update(value => value + (newTime - this.lastTime));
		this.lastTime = newTime;
		this.clearTimer();
		this.timer = setTimeout(() => {
			this.step();
		}, 1000);
	}

	private clearTimer(): void {
		if (this.timer === undefined) {
			return;
		}

		clearTimeout(this.timer);
		this.timer = undefined;
	}
}
