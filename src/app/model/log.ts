import { environment } from '../../environments/environment';

const enabled = environment.logging;

export const log = {
	error(...parameters: Array<unknown>): void {
		if (enabled) {
			console.error(...parameters);
		}
	},
	warn(...parameters: Array<unknown>): void {
		if (enabled) {
			console.warn(...parameters);
		}
	}
};
