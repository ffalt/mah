import { parseImportString } from './import';
import { MAX_IMPORT_BOARDS } from './mah-reader';
import { b64, makeBoard, makeMah } from './import.spec-helpers';
import { toBase64 } from './base64';
import { describe, it, expect } from 'vitest';

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
		const notJson = toBase64('not json at all');
		expect(parseImportString(notJson)).toEqual([]);
	});

	it('returns [] when the decoded JSON is null', () => {
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
		const boards = Array.from({ length: MAX_IMPORT_BOARDS + 1 }, (_, index) => makeBoard({ id: `id-${index}` }));
		expect(parseImportString(b64({ mah: '1.0', boards }))).toEqual([]);
	});

	it('returns [] when every board has an invalid structure', () => {
		const data = b64(makeMah([{ name: 123 }, null, 'string']));
		expect(parseImportString(data)).toEqual([]);
	});

	it('returns [] when a boards contains an invalid board', () => {
		const data = b64(makeMah([{ name: 123 }, makeBoard()]));
		const result = parseImportString(data);
		expect(result).toEqual([]);
	});

	it('keeps non-ascii board names intact', () => {
		const board = makeBoard({ name: 'Höhle', by: 'Jörg', cat: '麻雀' });
		const result = parseImportString(b64(makeMah([board])));
		expect(result[0].name).toBe('Höhle');
		expect(result[0].by).toBe('Jörg');
		expect(result[0].cat).toBe('麻雀');
	});

	it('returns all valid boards', () => {
		const boards = [makeBoard({ id: 'id-1', name: 'Board 1' }), makeBoard({ id: 'id-2', name: 'Board 2' })];
		const result = parseImportString(b64(makeMah(boards)));
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('id-1');
		expect(result[1].id).toBe('id-2');
	});
});
