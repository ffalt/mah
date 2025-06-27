export class Clock {
	elapsed = 0;
	private lastTime = 0;
	private timer?: number = undefined;

	start(): void {
		if (!this.timer) {
			this.elapsed = this.elapsed || 0;
		}
	}

	reset(): void {
		if (this.timer) {
			window.clearTimeout(this.timer);
			this.timer = undefined;
		}
		this.lastTime = 0;
		this.elapsed = 0;
	}

	run(): void {
		if (this.timer) {
			return;
		}
		this.lastTime = Date.now();
		this.timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}

	pause(): void {
		if (!this.timer) {
			return;
		}
		window.clearTimeout(this.timer);
		this.timer = undefined;
		this.elapsed += Date.now() - this.lastTime;
	}

	private step(): void {
		const newTime = Date.now();
		this.elapsed += newTime - this.lastTime;
		this.lastTime = newTime;
		this.timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}
}
