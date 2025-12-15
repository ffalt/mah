/* eslint-disable no-sparse-arrays, @stylistic/no-floating-decimal */

import { zzfx } from 'zzfx';

export const SOUNDS: { [index: string]: Array<number | undefined> } = {
	NOPE: [],
	SELECT: [2, .2, 400, , , .02, , 3, -50, , , , , , 16, , , , , , 500, 1],
	MATCH: [2, .2, 800, , , .02, , 3, -50, , , , , , 16, , , , , , 500, 1],
	OVER: [2, , 146, .02, .23, .04, 3, 2.47, -1.3, , , , , , -112, , .2, .99, .04],
	UNDO: [1, .1, 260, .24, , .05, , .7, 64, , 135, .22, .01, .1, , , .07, , .01, .54],
	HINT: [1, .1, 201, .09, .04, .08, 1, 1.87, , -25, , , , , 55, , , .4, .01],
	SHUFFLE: [1, 0, 288, 0.05, 0.01, , , 2, -10, , , , , , , , , 0.5, 0.1],
	WIN: [2, .05, 6, .09, .14, .46, 1, .28, 0, 0, -54, .09, .06, 0, 0, 0, .15, .54, .04, 0]
};

export class Sound {
	enabled: boolean = true;

	play(sound: Array<number | undefined>): void {
		if (!this.enabled) {
			return;
		}
		zzfx(...sound);
	}
}
