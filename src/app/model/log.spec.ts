import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { log } from './log';
import { Board } from './board';

describe('log', () => {
	const logging = environment.logging;
	let errorSpy: ReturnType<typeof vi.spyOn>;
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	});

	afterEach(() => {
		environment.logging = logging;
		errorSpy.mockRestore();
		warnSpy.mockRestore();
	});

	it('forwards to the console when logging is enabled', () => {
		environment.logging = true;

		log.error('boom', 1);
		log.warn('careful', 2);

		expect(errorSpy).toHaveBeenCalledWith('boom', 1);
		expect(warnSpy).toHaveBeenCalledWith('careful', 2);
	});

	// the apps build sets logging: false, which is the only config where the flag matters
	it('stays silent when logging is disabled', () => {
		environment.logging = false;

		log.error('boom');
		log.warn('careful');

		expect(errorSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();
	});

	// the call sites used to reach the console directly, so the flag did not silence them
	it('silences a failing call site when logging is disabled', () => {
		environment.logging = false;

		expect(new Board().load([], [])).toBe(false);

		expect(warnSpy).not.toHaveBeenCalled();
	});
});
