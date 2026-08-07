import { describe, it, expect } from 'vitest';
import { fromBase64, toBase64 } from './base64';

describe('base64', () => {
	it('round trips ascii', () => {
		expect(fromBase64(toBase64('plain ascii'))).toBe('plain ascii');
	});

	it('stays compatible with plain btoa for ascii', () => {
		expect(toBase64('plain ascii')).toBe(window.btoa('plain ascii'));
	});

	it('round trips non-ascii', () => {
		const value = 'Höhle der Löwen';
		expect(fromBase64(toBase64(value))).toBe(value);
	});

	it('round trips characters outside the basic plane', () => {
		const value = '🀄 麻雀 Маджонг';
		expect(fromBase64(toBase64(value))).toBe(value);
	});

	it('encodes as utf-8 instead of throwing on non latin-1 input', () => {
		expect(() => window.btoa('麻雀')).toThrow();
		expect(toBase64('麻雀')).toBe('6bq76ZuA');
	});

	it('decodes a payload encoded from utf-8 bytes elsewhere', () => {
		// what any external tool produces for {"name":"Höhle"}
		expect(fromBase64('eyJuYW1lIjoiSMO2aGxlIn0=')).toBe('{"name":"Höhle"}');
	});
});
