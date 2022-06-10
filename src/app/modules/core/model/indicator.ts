import {trigger, state, style, animate, transition} from '@angular/animations';

interface GestureIndicator {
	x: number;
	y: number;
	size: number;
	state: string;
	transform?: string;
}

export class Indicator {
	gestureIndicators: Array<GestureIndicator> = [];

	hide(gestureIndicator: any) {
		setTimeout(() => {
			if (gestureIndicator) {
				gestureIndicator.state = 'hidden';
				setTimeout(() => {
					if (gestureIndicator) {
						for (let i = 0; i < this.gestureIndicators.length; i++) {
							const indicator = this.gestureIndicators[i];
							if (indicator.x === gestureIndicator.x && indicator.y === gestureIndicator.y) {
								this.gestureIndicators.splice(i, 1);
								break;
							}
						}
					}
				}, 250);
			}
		}, 500);
	}

	display(x: number, y: number, size: number): GestureIndicator | undefined {
		if (x > 0 && y > 0) {
			const gestureIndicator: GestureIndicator = {x, y, size, state: 'hidden'};
			this.gestureIndicators.push(gestureIndicator);
			setTimeout(() => {
				gestureIndicator.state = 'visible';
			}, 100);
			return gestureIndicator;
		}
		return;
	}
}

export const IndicatorAnimations = [
	trigger('indicatorState', [
		state(
			'hidden',
			style({
				transform: 'scale(0, 0)'
			})
		),
		state(
			'visible',
			style({
				transform: 'scale(1, 1)'
			})
		),
		transition('hidden => visible', animate('150ms ease-in')),
		transition('visible => hidden', animate('150ms ease-out'))
	])
];
