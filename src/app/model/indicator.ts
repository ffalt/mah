import { signal, type WritableSignal } from '@angular/core';

interface GestureIndicator {
	x: number;
	y: number;
	size: number;
	state: WritableSignal<'hidden' | 'visible'>;
	transform?: string;
	top: number;
	left: number;
	hideTimerId?: ReturnType<typeof setTimeout>;
	removeTimerId?: ReturnType<typeof setTimeout>;
}

export class Indicator {
	readonly gestureIndicators = signal<Array<GestureIndicator>>([]);

	hide(gestureIndicator?: { x: number; y: number }) {
		const indicator = gestureIndicator;
		if (!indicator) {
			return;
		}

		// Find by reference first, then fall back to coordinate match
		const list = this.gestureIndicators();
		const fullIndicator =
			list.find(gi => gi === indicator) ??
			list.find(gi => gi.x === indicator.x && gi.y === indicator.y);

		if (!fullIndicator) {
			return;
		}

		// Cancel any pending hide operations for this indicator
		this.cancelHideTimer(fullIndicator);

		// Schedule hide state change
		fullIndicator.hideTimerId = setTimeout(() => {
			fullIndicator.state.set('hidden');
			fullIndicator.hideTimerId = undefined;

			// Schedule removal
			fullIndicator.removeTimerId = setTimeout(() => {
				this.removeIndicator(fullIndicator);
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

	removeIndicator(gestureIndicator: { x: number; y: number }) {
		const target = this.gestureIndicators().find(indicator => indicator.x === gestureIndicator.x && indicator.y === gestureIndicator.y);
		if (target) {
			// Cancel any pending timers before removing
			this.cancelHideTimer(target);
			this.gestureIndicators.update(list => list.filter(indicator => indicator !== target));
		}
	}

	setSize(nr: number, size: number): void {
		const indicator = this.gestureIndicators()[nr];
		indicator.size = size;
		indicator.top = indicator.y - (size / 2);
		indicator.left = indicator.x - (size / 2);
		this.gestureIndicators.update(list => [...list]);
	}

	display(x: number, y: number, size: number): GestureIndicator | undefined {
		if (x > 0 && y > 0) {
			const gestureIndicator: GestureIndicator = {
				x,
				y,
				size,
				top: y - (size / 2),
				left: x - (size / 2),
				state: signal<'hidden' | 'visible'>('hidden')
			};
			this.gestureIndicators.update(list => [...list, gestureIndicator]);
			setTimeout(() => {
				gestureIndicator.state.set('visible');
			}, 100);
			return gestureIndicator;
		}
		return undefined;
	}
}
