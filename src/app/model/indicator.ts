interface GestureIndicator {
	x: number;
	y: number;
	size: number;
	state: string;
	transform?: string;
	top: number;
	left: number;
	hideTimerId?: ReturnType<typeof setTimeout>;
	removeTimerId?: ReturnType<typeof setTimeout>;
}

export class Indicator {
	gestureIndicators: Array<GestureIndicator> = [];

	hide(gestureIndicator?: { state: string; x: number; y: number }) {
		const indicator = gestureIndicator;
		if (!indicator) {
			return;
		}

		// Find the full indicator object in the array
		const fullIndicator = this.gestureIndicators.find(
			gi => gi.x === indicator.x && gi.y === indicator.y
		);

		if (!fullIndicator) {
			return;
		}

		// Cancel any pending hide operations for this indicator
		this.cancelHideTimer(fullIndicator);

		// Schedule hide state change
		fullIndicator.hideTimerId = setTimeout(() => {
			fullIndicator.state = 'hidden';
			fullIndicator.hideTimerId = undefined;

			// Schedule removal
			fullIndicator.removeTimerId = setTimeout(() => {
				this.removeIndicator(gestureIndicator);
				fullIndicator.removeTimerId = undefined;
			}, 250);
		}, 500);
	}

	private cancelHideTimer(indicator: GestureIndicator): void {
		if (indicator.hideTimerId !== undefined) {
			clearTimeout(indicator.hideTimerId);
			indicator.hideTimerId = undefined;
		}
		if (indicator.removeTimerId !== undefined) {
			clearTimeout(indicator.removeTimerId);
			indicator.removeTimerId = undefined;
		}
	}

	removeIndicator(gestureIndicator: { state: string; x: number; y: number }) {
		for (let index = 0; index < this.gestureIndicators.length; index++) {
			const indicator = this.gestureIndicators[index];
			if (indicator.x === gestureIndicator.x && indicator.y === gestureIndicator.y) {
				// Cancel any pending timers before removing
				this.cancelHideTimer(indicator);
				this.gestureIndicators.splice(index, 1);
				break;
			}
		}
	}

	setSize(nr: number, size: number): void {
		this.gestureIndicators[nr].size = size;
		this.gestureIndicators[nr].top = this.gestureIndicators[nr].y - (size / 2);
		this.gestureIndicators[nr].left = this.gestureIndicators[nr].x - (size / 2);
	}

	display(x: number, y: number, size: number): GestureIndicator | undefined {
		if (x > 0 && y > 0) {
			const gestureIndicator: GestureIndicator = {
				x,
				y,
				size,
				top: y - (size / 2),
				left: x - (size / 2),
				state: 'hidden'
			};
			this.gestureIndicators.push(gestureIndicator);
			setTimeout(() => {
				gestureIndicator.state = 'visible';
			}, 100);
			return gestureIndicator;
		}
		return undefined;
	}
}
