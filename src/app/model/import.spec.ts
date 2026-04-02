import { isValidLoadLayout, MAX_IMPORT_BOARDS, parseImportString } from './import';

function b64(json: unknown): string {
	return Buffer.from(JSON.stringify(json)).toString('base64');
}

const VALID_MAP = [[0, [[0, 0]]]];

function makeBoard(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
	return { id: 'test-id', name: 'Test Board', map: VALID_MAP, ...overrides };
}

function makeMah(boards: unknown[] = [makeBoard()]): unknown {
	return { mah: '1.0', boards };
}

describe('isValidLoadLayout', () => {
	it('returns false for null', () => {
		expect(isValidLoadLayout(null)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isValidLoadLayout(undefined)).toBe(false);
	});

	it('returns false for a string', () => {
		expect(isValidLoadLayout('hello')).toBe(false);
	});

	it('returns false for a number', () => {
		expect(isValidLoadLayout(42)).toBe(false);
	});

	it('returns false for an array', () => {
		expect(isValidLoadLayout([])).toBe(false);
	});

	it('returns false when name is missing', () => {
		expect(isValidLoadLayout({ map: VALID_MAP })).toBe(false);
	});

	it('returns false when name is not a string', () => {
		expect(isValidLoadLayout({ name: 123, map: VALID_MAP })).toBe(false);
	});

	it('returns false when name is empty string', () => {
		expect(isValidLoadLayout({ name: '', map: VALID_MAP })).toBe(false);
	});

	it('returns false when name is whitespace only', () => {
		expect(isValidLoadLayout({ name: '   ', map: VALID_MAP })).toBe(false);
	});

	it('returns false when name exceeds 200 characters', () => {
		expect(isValidLoadLayout({ name: 'a'.repeat(201), map: VALID_MAP })).toBe(false);
	});

	it('returns false when map is missing', () => {
		expect(isValidLoadLayout({ name: 'Test' })).toBe(false);
	});

	it('returns false when map is not an array', () => {
		expect(isValidLoadLayout({ name: 'Test', map: 'invalid' })).toBe(false);
	});

	it('returns false when map is an object', () => {
		expect(isValidLoadLayout({ name: 'Test', map: {} })).toBe(false);
	});

	it('returns false when id is not a string', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, id: 123 })).toBe(false);
	});

	it('returns false when id exceeds 200 characters', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, id: 'a'.repeat(201) })).toBe(false);
	});

	it('returns false when by is not a string', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, by: 99 })).toBe(false);
	});

	it('returns false when by exceeds 200 characters', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, by: 'a'.repeat(201) })).toBe(false);
	});

	it('returns false when cat is not a string', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, cat: true })).toBe(false);
	});

	it('returns false when cat exceeds 200 characters', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, cat: 'a'.repeat(201) })).toBe(false);
	});

	it('returns true for a valid minimal board (name + map)', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP })).toBe(true);
	});

	it('returns true when id is exactly 200 characters', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, id: 'a'.repeat(200) })).toBe(true);
	});

	it('returns true for a fully specified valid board', () => {
		expect(isValidLoadLayout({ id: 'my-id', name: 'Test Board', map: VALID_MAP, by: 'Author', cat: 'Classic' })).toBe(true);
	});

	it('returns true when optional fields are undefined', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, id: undefined, by: undefined, cat: undefined })).toBe(true);
	});
});

describe('parseImportString', () => {
	it('returns [] for null input', () => {
		expect(parseImportString(null)).toEqual([]);
	});

	it('returns [] for empty string input', () => {
		expect(parseImportString('')).toEqual([]);
	});

	it('returns [] for invalid base64', () => {
		expect(parseImportString('!!!not-base64!!!')).toEqual([]);
	});

	it('returns [] for valid base64 but invalid JSON', () => {
		const notJson = Buffer.from('not json at all').toString('base64');
		expect(parseImportString(notJson)).toEqual([]);
	});

	it('returns [] when parsed JSON is null (triggers outer catch)', () => {
		expect(parseImportString(b64(null))).toEqual([]);
	});

	it('returns [] when mah field is missing', () => {
		expect(parseImportString(b64({ boards: [] }))).toEqual([]);
	});

	it('returns [] when mah version is wrong', () => {
		expect(parseImportString(b64({ mah: '2.0', boards: [] }))).toEqual([]);
	});

	it('returns [] when boards is not an array', () => {
		expect(parseImportString(b64({ mah: '1.0', boards: 'oops' }))).toEqual([]);
	});

	it('returns [] when boards array is empty', () => {
		expect(parseImportString(b64({ mah: '1.0', boards: [] }))).toEqual([]);
	});

	it('returns [] when board count exceeds MAX_IMPORT_BOARDS', () => {
		const boards = Array.from({ length: MAX_IMPORT_BOARDS + 1 }, (_, i) => makeBoard({ id: `id-${i}` }));
		expect(parseImportString(b64({ mah: '1.0', boards }))).toEqual([]);
	});

	it('skips boards with invalid structure', () => {
		const data = b64(makeMah([{ name: 123 }, null, 'string']));
		expect(parseImportString(data)).toEqual([]);
	});

	it('returns only valid boards from a mixed list', () => {
		const data = b64(makeMah([{ name: 123 }, makeBoard()]));
		const result = parseImportString(data);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Test Board');
	});

	it('returns all valid boards', () => {
		const boards = [makeBoard({ id: 'id-1', name: 'Board 1' }), makeBoard({ id: 'id-2', name: 'Board 2' })];
		const result = parseImportString(b64(makeMah(boards)));
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('id-1');
		expect(result[1].id).toBe('id-2');
	});
});
