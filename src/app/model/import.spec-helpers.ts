import { toBase64 } from './base64';

export const VALID_MAP = [[0, [[0, 0]]]];

export function b64(json: unknown): string {
	return toBase64(JSON.stringify(json));
}

export function makeLayout(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
	return { id: 'test-id', name: 'Test Layout', map: VALID_MAP, ...overrides };
}

export function makeMah(layouts: Array<unknown> = [makeLayout()]): unknown {
	return { mah: '1.0', boards: layouts };
}
