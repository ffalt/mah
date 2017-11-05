interface ImagePreloaderSettings {
	statusInterval: number;
	noProgressTimeout: number;
}

const ResourceState = {
	QUEUED: 0,
	WAITING: 1,
	LOADED: 2,
	ERROR: 3,
	TIMEOUT: 4
};


interface HTMLImageElementExt extends HTMLImageElement {
	readyState: string;
}

class HTMLImagePreLoader {
	public loader: ImagePreloader = null;
	public img: HTMLImageElementExt = <HTMLImageElementExt>(new Image());
	public priority: number;
	public url: string;
	public status = ResourceState.ERROR;
	private onReadyStateChangeListener: EventListener;
	private onLoadListener: EventListener;
	private onErrorListener: EventListener;

	constructor(url: string, priority: number, loader: ImagePreloader) {
		this.priority = priority;
		this.url = url;
		this.loader = loader;
	}

	public removeEventHandlers() {
		this.img.removeEventListener('load', this.onLoadListener);
		this.img.removeEventListener('readystatechange', this.onReadyStateChangeListener);
		this.img.removeEventListener('error', this.onErrorListener);
	}

	public start() {

		this.onReadyStateChangeListener = (evt: Event) => {
			if (this.img.readyState === 'complete') {
				this.removeEventHandlers();
				this.loader.onLoad(this);
			}
		};

		this.onErrorListener = (evt: Event) => {
			this.removeEventHandlers();
			this.loader.onError(this);
		};

		this.onLoadListener = (evt: Event) => {
			this.removeEventHandlers();
			this.loader.onLoad(this);
		};

		this.img.addEventListener('load', this.onLoadListener, false);
		this.img.addEventListener('readystatechange', this.onReadyStateChangeListener, false);
		this.img.addEventListener('error', this.onErrorListener, false);
		this.img.src = this.url;
	}

	public checkStatus() {
		if (this.img.complete) {
			this.removeEventHandlers();
			this.loader.onLoad(this);
		}
	}

	public onTimeout() {
		this.removeEventHandlers();
		if (this.img.complete) {
			this.loader.onLoad(this);
		} else {
			this.loader.onTimeout(this);
		}
	}
}

export class ImagePreloader {
	public images: Array<string> = [];
	public settings: ImagePreloaderSettings = {
		// how frequently we poll resources for progress
		statusInterval: 5000, // every 5 seconds by default
		// stop waiting if no progress has been made in the moving time window
		noProgressTimeout: Infinity // do not stop waiting by default
	};
	public entries: Array<HTMLImagePreLoader> = [];
	public progressListeners: Array<(completedCount: number, totalCount: number) => void> = [];
	public timeStarted = Date.now();
	public progressChanged = Date.now();

	constructor(settings?: ImagePreloaderSettings) {
		if (settings) {
			if (settings.statusInterval !== null) {
				this.settings.statusInterval = settings.statusInterval;
			}
			if (settings.noProgressTimeout !== null) {
				this.settings.noProgressTimeout = settings.noProgressTimeout;
			}
		}
	}

	public statusCheck() {
		let checkAgain = false;
		const noProgressTime = Date.now() - this.progressChanged;
		const timedOut = (noProgressTime >= this.settings.noProgressTimeout);
		for (let i = 0, len = this.entries.length; i < len; i++) {
			const entry = this.entries[i];
			if (entry.status !== ResourceState.WAITING) {
				continue;
			}
			entry.checkStatus();
			if (entry.status === ResourceState.WAITING) {
				if (timedOut) {
					entry.onTimeout();
				} else {
					checkAgain = true;
				}
			}
		}
		if (checkAgain) {
			window.setTimeout(() => {
				this.statusCheck();
			}, this.settings.statusInterval);
		}
	}

	// public isBusy() {
	// 	for (let i = 0, len = this.entries.length; i < len; i++) {
	// 		if (this.entries[i].status === ResourceState.QUEUED || this.entries[i].status === ResourceState.WAITING) {
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// }

	public onProgress(resource: HTMLImagePreLoader, statusType: number) {
		let entry: HTMLImagePreLoader = null;
		for (let i = 0, len = this.entries.length; i < len; i++) {
			if (this.entries[i] === resource) {
				entry = this.entries[i];
				break;
			}
		}
		if (entry == null || entry.status !== ResourceState.WAITING) {
			return;
		}
		entry.status = statusType;
		this.progressChanged = Date.now();
		let completed = 0;
		let total = 0;
		for (let i = 0, len = this.entries.length; i < len; i++) {
			const e = this.entries[i];
			total++;
			if (e.status === ResourceState.LOADED ||
				e.status === ResourceState.ERROR ||
				e.status === ResourceState.TIMEOUT) {
				completed++;
			}
		}
		for (let i = 0, len = this.progressListeners.length; i < len; i++) {
			this.progressListeners[i](completed, total);
		}
	}

	public onLoad(imageLoader: HTMLImagePreLoader) {
		this.onProgress(imageLoader, ResourceState.LOADED);
	}

	public onError(imageLoader: HTMLImagePreLoader) {
		this.onProgress(imageLoader, ResourceState.ERROR);
	}

	public onTimeout(imageLoader: HTMLImagePreLoader) {
		this.onProgress(imageLoader, ResourceState.TIMEOUT);
	}

	public add(image: string) {
		if (this.images.indexOf(image) < 0) {
			this.images.push(image);
		}
		const imageLoader = new HTMLImagePreLoader(image, Infinity, this);
		this.entries.push(imageLoader);
	}

	public start(completeCallback: () => void, progressCallback: (progress: number) => void) {
		this.progressListeners.push((completedCount: number, totalCount: number) => {
			if (progressCallback) {
				progressCallback(completedCount / totalCount);
			}
			if ((completedCount === totalCount) && completeCallback) {
				completeCallback();
			}
		});
		this.timeStarted = Date.now();
		for (let i = 0, len = this.entries.length; i < len; i++) {
			const entry = this.entries[i];
			entry.status = ResourceState.WAITING;
			entry.start();
		}
		window.setTimeout(() => {
			this.statusCheck();
		}, 100);
	}
}
