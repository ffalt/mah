import { toBase64 } from './base64';

export const VALID_MAP = [[0, [[0, 0]]]];

export function b64(json: unknown): string {
	return toBase64(JSON.stringify(json));
}

export function makeBoard(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
	return { id: 'test-id', name: 'Test Board', map: VALID_MAP, ...overrides };
}

export function makeMah(boards: Array<unknown> = [makeBoard()]): unknown {
	return { mah: '1.0', boards };
}
