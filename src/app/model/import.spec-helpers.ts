export const VALID_MAP = [[0, [[0, 0]]]];

export function b64(json: unknown): string {
	return Buffer.from(JSON.stringify(json)).toString('base64');
}

export function makeBoard(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
	return { id: 'test-id', name: 'Test Board', map: VALID_MAP, ...overrides };
}

export function makeMah(boards: Array<unknown> = [makeBoard()]): unknown {
	return { mah: '1.0', boards };
}
