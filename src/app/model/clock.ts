export class Clock {
	elapsed = 0;
	private _lastTime = 0;
	private _started = 0;
	private _timer?: number = undefined;

	start(): void {
		if (!this._timer) {
			this.elapsed = this.elapsed || 0;
		}
	}

	reset(): void {
		if (this._timer) {
			window.clearTimeout(this._timer);
			this._timer = undefined;
		}
		this._started = 0;
		this._lastTime = 0;
		this.elapsed = 0;
	}

	run(): void {
		if (this._timer) {
			return;
		}
		this._lastTime = Date.now();
		this._timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}

	pause(): void {
		if (!this._timer) {
			return;
		}
		window.clearTimeout(this._timer);
		this._timer = undefined;
		const newtime = Date.now();
		this.elapsed += newtime - this._lastTime;
	}

	private step(): void {
		const newtime = Date.now();
		this.elapsed += newtime - this._lastTime;
		this._lastTime = newtime;
		this._timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}
}
