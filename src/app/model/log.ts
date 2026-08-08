import { environment } from '../../environments/environment';

export const log = {
	error(...parameters: Array<unknown>): void {
		if (environment.logging) {
			// eslint-disable-next-line no-console
			console.error(...parameters);
		}
	},
	warn(...parameters: Array<unknown>): void {
		if (environment.logging) {
			// eslint-disable-next-line no-console
			console.warn(...parameters);
		}
	}
};
