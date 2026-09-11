import { isValidLoadLayout, MAX_IMPORT_BOARDS, parseMahFormat } from './mah-reader';
import { makeBoard, makeMah, VALID_MAP } from './import.spec-helpers';
import { describe, it, expect } from 'vitest';

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
		expect(isValidLoadLayout({ name: ' '.repeat(3), map: VALID_MAP })).toBe(false);
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

describe('parseMahFormat', () => {
	it('returns the parsed document for a valid import', () => {
		const mah = parseMahFormat(JSON.stringify(makeMah()));
		expect(mah.mah).toBe('1.0');
		expect(mah.boards).toHaveLength(1);
		expect(mah.boards[0].name).toBe('Test Board');
	});

	it('returns every board of a multi board import', () => {
		const boards = [makeBoard({ id: 'id-1', name: 'Board 1' }), makeBoard({ id: 'id-2', name: 'Board 2' })];
		const mah = parseMahFormat(JSON.stringify(makeMah(boards)));
		expect(mah.boards.map(board => board.id)).toEqual(['id-1', 'id-2']);
	});

	it('accepts exactly MAX_IMPORT_BOARDS boards', () => {
		const boards = Array.from({ length: MAX_IMPORT_BOARDS }, (_, index) => makeBoard({ id: `id-${index}` }));
		expect(parseMahFormat(JSON.stringify(makeMah(boards))).boards).toHaveLength(MAX_IMPORT_BOARDS);
	});

	it('throws for malformed JSON', () => {
		expect(() => parseMahFormat('not json at all')).toThrow('Import failed: Invalid JSON format');
	});

	it('keeps the JSON parse error as the cause', () => {
		let cause: unknown;
		try {
			parseMahFormat('{');
		} catch (error) {
			cause = (error as Error).cause;
		}
		expect(cause).toBeInstanceOf(SyntaxError);
	});

	it('throws for a null document', () => {
		expect(() => parseMahFormat('null')).toThrow('Import failed: Import data is not an object');
	});

	it('throws for a primitive document', () => {
		expect(() => parseMahFormat('42')).toThrow('Import failed: Import data is not an object');
	});

	it('throws for an array document', () => {
		expect(() => parseMahFormat('[]')).toThrow('Import failed: Import data is not an object');
	});

	it('throws a TypeError for a document that is not an object', () => {
		expect(() => parseMahFormat('null')).toThrow(TypeError);
	});

	it('throws when the mah version is missing', () => {
		expect(() => parseMahFormat(JSON.stringify({ boards: [makeBoard()] })))
			.toThrow('Import failed: Invalid or unsupported MAH format version');
	});

	it('throws when the mah version is unsupported', () => {
		expect(() => parseMahFormat(JSON.stringify({ mah: '2.0', boards: [makeBoard()] })))
			.toThrow('Import failed: Invalid or unsupported MAH format version');
	});

	it('throws a TypeError when boards is not an array', () => {
		expect(() => parseMahFormat(JSON.stringify({ mah: '1.0', boards: 'oops' }))).toThrow(TypeError);
		expect(() => parseMahFormat(JSON.stringify({ mah: '1.0', boards: {} }))).toThrow(TypeError);
	});

	it('throws when boards is missing', () => {
		expect(() => parseMahFormat(JSON.stringify({ mah: '1.0' })))
			.toThrow('Import failed: Missing or invalid boards array');
	});

	it('throws when boards is empty', () => {
		expect(() => parseMahFormat(JSON.stringify(makeMah([])))).toThrow('Import failed: No boards found in import data');
	});

	it('throws when boards exceed MAX_IMPORT_BOARDS', () => {
		const boards = Array.from({ length: MAX_IMPORT_BOARDS + 1 }, (_, index) => makeBoard({ id: `id-${index}` }));
		expect(() => parseMahFormat(JSON.stringify(makeMah(boards))))
			.toThrow(`Import failed: Too many boards (${MAX_IMPORT_BOARDS + 1}), maximum is ${MAX_IMPORT_BOARDS}`);
	});

	it('throws on an invalid board instead of skipping it', () => {
		expect(() => parseMahFormat(JSON.stringify(makeMah([makeBoard(), { name: 123 }]))))
			.toThrow('Import failed: Board entry has invalid structure');
	});

	it('does not pollute Object.prototype through a __proto__ payload', () => {
		const payload = '{"mah":"1.0","boards":[{"id":"abc","name":"Test","map":[]}],"__proto__":{"polluted":true}}';
		expect(parseMahFormat(payload).boards).toHaveLength(1);
		expect((({}) as Record<string, unknown>).polluted).toBeUndefined();
	});
});
