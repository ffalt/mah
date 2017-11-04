export class Clock {
	public elapsed = 0;
	private _lastTime = 0;
	private _started = 0;
	private _timer: number = null;

	constructor() {
	}

	public start() {
		if (!this._timer) {
			this.elapsed = this.elapsed || 0;
		}
	}

	public reset() {
		if (this._timer) {
			window.clearTimeout(this._timer);
			this._timer = null;
		}
		this._started = 0;
		this._lastTime = 0;
		this.elapsed = 0;
	}

	public run() {
		if (this._timer) {
			return;
		}
		this._lastTime = (new Date()).getTime();
		this._timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}

	public pause() {
		if (!this._timer) {
			return;
		}
		window.clearTimeout(this._timer);
		this._timer = null;
		const newtime = (new Date).getTime();
		this.elapsed += newtime - this._lastTime;
	}

	private step() {
		const newtime = (new Date).getTime();
		this.elapsed += newtime - this._lastTime;
		this._lastTime = newtime;
		this._timer = window.setTimeout(() => {
			this.step();
		}, 1000);
	}
}
