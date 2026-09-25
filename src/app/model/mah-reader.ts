import type { LoadLayout, MahFormat } from './types';
import { expandMapping, hasPlaceCollisions, isValidCompactMapping } from './mapping';

export const MAX_IMPORT_LAYOUTS = 2000;

export function isValidLoadLayout(o: unknown): o is LoadLayout {
	if (!o || typeof o !== 'object' || Array.isArray(o)) {
		return false;
	}
	const layout = o as Record<string, unknown>;
	return !(
		typeof layout.name !== 'string' ||
		layout.name.trim() === '' ||
		layout.name.length > 200 ||
		!isValidCompactMapping(layout.map) ||
		hasPlaceCollisions(expandMapping(layout.map)) ||
		(layout.id !== undefined && (typeof layout.id !== 'string' || layout.id.length > 200)) ||
		(layout.by !== undefined && (typeof layout.by !== 'string' || layout.by.length > 200)) ||
		(layout.cat !== undefined && (typeof layout.cat !== 'string' || layout.cat.length > 200))
	);
}

export function parseMahFormat(jsonString: string): MahFormat {
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonString);
	} catch (error) {
		throw new Error('Import failed: Invalid JSON format', { cause: error });
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new TypeError('Import failed: Import data is not an object');
	}
	const mah = parsed as MahFormat;
	if (!mah.mah || mah.mah !== '1.0') {
		throw new Error('Import failed: Invalid or unsupported MAH format version');
	}
	const layouts = mah.boards;
	if (!Array.isArray(layouts)) {
		throw new TypeError('Import failed: Missing or invalid boards array');
	}
	if (layouts.length === 0) {
		throw new Error('Import failed: No layouts found in import data');
	}
	if (layouts.length > MAX_IMPORT_LAYOUTS) {
		throw new Error(`Import failed: Too many layouts (${layouts.length}), maximum is ${MAX_IMPORT_LAYOUTS}`);
	}
	for (const layout of layouts) {
		if (!isValidLoadLayout(layout)) {
			throw new Error('Import failed: Layout entry has invalid structure');
		}
	}
	return mah;
}
