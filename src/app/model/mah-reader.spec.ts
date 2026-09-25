import { isValidLoadLayout, MAX_IMPORT_LAYOUTS, parseMahFormat } from './mah-reader';
import { makeLayout, makeMah, VALID_MAP } from './import.spec-helpers';
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

	describe('map contents', () => {
		const rejected: Array<[string, unknown]> = [
			['a level that is not an array', ['junk']],
			['rows that are not an array', [[0, 'not-rows']]],
			['cells that are not a number', [[0, [[0, 'oops']]]]],
			['a level index that is not a number', [['a', [[0, 0]]]]],
			['a row index that is null', [[0, [[null, 0]]]]],
			['a negative coordinate', [[-1, [[0, 0]]]]],
			['a fractional coordinate', [[0.5, [[0, 0]]]]],
			['a NaN coordinate', [[0, [[0, Number.NaN]]]]],
			['a run that is not a [start, count] pair', [[0, [[0, [[1, 2, 3]]]]]]],
			['a row that is not a [y, cells] pair', [[0, [[0, 0, 9]]]]],
			['a level that is not a [z, rows] pair', [[0, [[0, 0]], 'extra']]]
		];

		for (const [what, map] of rejected) {
			it(`returns false for ${what}`, () => {
				expect(isValidLoadLayout({ name: 'Test', map })).toBe(false);
			});
		}

		it('returns true for cells mixing single tiles and runs, as the exporter writes them', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, [0, [8, 6], 26]]]]] })).toBe(true);
		});
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

	describe('colliding tiles', () => {
		it('returns false when two tiles share a place', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, [4, 4]]]]] })).toBe(false);
		});

		it('returns false when a repeated cell run lands on a literal already in the row', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, [[0, 6], 10]]]]] })).toBe(false);
		});

		it('returns false when two tiles overlap by half a tile in a row', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, [4, 5]]]]] })).toBe(false);
		});

		it('returns false when two tiles overlap by half a tile across rows', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, 4], [1, 5]]]] })).toBe(false);
		});

		it('returns true when tiles sit a full tile apart', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, [4, 6]], [2, 4]]]] })).toBe(true);
		});

		it('returns true when tiles share a place on different levels', () => {
			expect(isValidLoadLayout({ name: 'Test', map: [[0, [[0, 4]]], [1, [[0, 4]]]] })).toBe(true);
		});
	});

	it('returns true for a valid minimal layout (name + map)', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP })).toBe(true);
	});

	it('returns true when id is exactly 200 characters', () => {
		expect(isValidLoadLayout({ name: 'Test', map: VALID_MAP, id: 'a'.repeat(200) })).toBe(true);
	});

	it('returns true for a fully specified valid layout', () => {
		expect(isValidLoadLayout({ id: 'my-id', name: 'Test Layout', map: VALID_MAP, by: 'Author', cat: 'Classic' })).toBe(true);
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
		expect(mah.boards[0].name).toBe('Test Layout');
	});

	it('returns every layout of a multi layout import', () => {
		const layouts = [makeLayout({ id: 'id-1', name: 'Layout 1' }), makeLayout({ id: 'id-2', name: 'Layout 2' })];
		const mah = parseMahFormat(JSON.stringify(makeMah(layouts)));
		expect(mah.boards.map(layout => layout.id)).toEqual(['id-1', 'id-2']);
	});

	it('accepts exactly MAX_IMPORT_LAYOUTS layouts', () => {
		const layouts = Array.from(
			{ length: MAX_IMPORT_LAYOUTS },
			(_, index) => makeLayout({ id: `id-${index}` })
		);
		expect(parseMahFormat(JSON.stringify(makeMah(layouts))).boards).toHaveLength(MAX_IMPORT_LAYOUTS);
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
		expect(() => parseMahFormat(JSON.stringify({ boards: [makeLayout()] })))
			.toThrow('Import failed: Invalid or unsupported MAH format version');
	});

	it('throws when the mah version is unsupported', () => {
		expect(() => parseMahFormat(JSON.stringify({ mah: '2.0', boards: [makeLayout()] })))
			.toThrow('Import failed: Invalid or unsupported MAH format version');
	});

	it('throws a TypeError when layouts is not an array', () => {
		expect(() => parseMahFormat(JSON.stringify({ mah: '1.0', boards: 'oops' }))).toThrow(TypeError);
		expect(() => parseMahFormat(JSON.stringify({ mah: '1.0', boards: {} }))).toThrow(TypeError);
	});

	it('throws when layouts is missing', () => {
		expect(() => parseMahFormat(JSON.stringify({ mah: '1.0' })))
			.toThrow('Import failed: Missing or invalid boards array');
	});

	it('throws when layouts are empty', () => {
		expect(() => parseMahFormat(JSON.stringify(makeMah([])))).toThrow('Import failed: No layouts found in import data');
	});

	it('throws when layouts exceed MAX_IMPORT_LAYOUTS', () => {
		const layouts = Array.from(
			{ length: MAX_IMPORT_LAYOUTS + 1 },
			(_, index) => makeLayout({ id: `id-${index}` })
		);
		expect(() => parseMahFormat(JSON.stringify(makeMah(layouts))))
			.toThrow(`Import failed: Too many layouts (${MAX_IMPORT_LAYOUTS + 1}), maximum is ${MAX_IMPORT_LAYOUTS}`);
	});

	it('throws on a layout whose tiles collide', () => {
		expect(() => parseMahFormat(JSON.stringify(makeMah([makeLayout({ map: [[0, [[0, [4, 5]]]]] })]))))
			.toThrow('Import failed: Layout entry has invalid structure');
	});

	it('throws on an invalid layout instead of skipping it', () => {
		expect(() => parseMahFormat(JSON.stringify(makeMah([makeLayout(), { name: 123 }]))))
			.toThrow('Import failed: Layout entry has invalid structure');
	});

	it('does not pollute Object.prototype through a __proto__ payload', () => {
		const payload = '{"mah":"1.0","boards":[{"id":"abc","name":"Test","map":[]}],"__proto__":{"polluted":true}}';
		expect(parseMahFormat(payload).boards).toHaveLength(1);
		expect((({}) as Record<string, unknown>).polluted).toBeUndefined();
	});
});
