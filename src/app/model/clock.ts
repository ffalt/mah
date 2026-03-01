export class Clock {
	elapsed = 0;
	private lastTime = 0;
	private timer?: number = undefined;

	reset(): void {
		this.clearTimer();
		this.lastTime = 0;
		this.elapsed = 0;
	}

	run(): void {
		if (this.timer !== undefined) {
			return;
		}
		this.lastTime = Date.now();
		this.timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}

	pause(): void {
		if (this.timer === undefined) {
			return;
		}
		this.clearTimer();
		this.elapsed += Date.now() - this.lastTime;
	}

	private step(): void {
		const newTime = Date.now();
		this.elapsed += newTime - this.lastTime;
		this.lastTime = newTime;
		this.clearTimer();
		this.timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}

	private clearTimer(): void {
		if (this.timer !== undefined) {
			window.clearTimeout(this.timer);
			this.timer = undefined;
		}
	}
}
