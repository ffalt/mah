import { parseImportString } from './import';
import { MAX_IMPORT_LAYOUTS } from './mah-reader';
import { b64, makeLayout, makeMah } from './import.spec-helpers';
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

	it('returns [] when layout is not an array', () => {
		expect(parseImportString(b64({ mah: '1.0', boards: 'oops' }))).toEqual([]);
	});

	it('returns [] when layouts array is empty', () => {
		expect(parseImportString(b64({ mah: '1.0', boards: [] }))).toEqual([]);
	});

	it('returns [] when layout count exceeds MAX_IMPORT_LAYOUTS', () => {
		const layouts = Array.from(
			{ length: MAX_IMPORT_LAYOUTS + 1 },
			(_, index) => makeLayout({ id: `id-${index}` })
		);
		expect(parseImportString(b64({ mah: '1.0', boards: layouts }))).toEqual([]);
	});

	it('returns [] when every layout has an invalid structure', () => {
		const data = b64(makeMah([{ name: 123 }, null, 'string']));
		expect(parseImportString(data)).toEqual([]);
	});

	it('returns [] when layouts contains an invalid layout', () => {
		const data = b64(makeMah([{ name: 123 }, makeLayout()]));
		const result = parseImportString(data);
		expect(result).toEqual([]);
	});

	it('keeps non-ascii layout names intact', () => {
		const layout = makeLayout({ name: 'Höhle', by: 'Jörg', cat: '麻雀' });
		const result = parseImportString(b64(makeMah([layout])));
		expect(result[0].name).toBe('Höhle');
		expect(result[0].by).toBe('Jörg');
		expect(result[0].cat).toBe('麻雀');
	});

	it('returns all valid layouts', () => {
		const layouts = [makeLayout({ id: 'id-1', name: 'Layout 1' }), makeLayout({ id: 'id-2', name: 'Layout 2' })];
		const result = parseImportString(b64(makeMah(layouts)));
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('id-1');
		expect(result[1].id).toBe('id-2');
	});
});
