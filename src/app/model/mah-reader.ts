import type { LoadLayout, MahFormat } from './types';
import { expandMapping, hasPlaceCollisions, isValidCompactMapping } from './mapping';

export const MAX_IMPORT_BOARDS = 2000;

export function isValidLoadLayout(board: unknown): board is LoadLayout {
	if (!board || typeof board !== 'object' || Array.isArray(board)) {
		return false;
	}
	const b = board as Record<string, unknown>;
	if (typeof b.name !== 'string' || b.name.trim() === '' || b.name.length > 200) {
		return false;
	}
	if (!isValidCompactMapping(b.map)) {
		return false;
	}
	if (hasPlaceCollisions(expandMapping(b.map))) {
		return false;
	}
	if (b.id !== undefined && (typeof b.id !== 'string' || b.id.length > 200)) {
		return false;
	}
	if (b.by !== undefined && (typeof b.by !== 'string' || b.by.length > 200)) {
		return false;
	}
	if (b.cat !== undefined && (typeof b.cat !== 'string' || b.cat.length > 200)) {
		return false;
	}
	return true;
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
	if (!Array.isArray(mah.boards)) {
		throw new TypeError('Import failed: Missing or invalid boards array');
	}
	if (mah.boards.length === 0) {
		throw new Error('Import failed: No boards found in import data');
	}
	if (mah.boards.length > MAX_IMPORT_BOARDS) {
		throw new Error(`Import failed: Too many boards (${mah.boards.length}), maximum is ${MAX_IMPORT_BOARDS}`);
	}
	for (const board of mah.boards) {
		if (!isValidLoadLayout(board)) {
			throw new Error('Import failed: Board entry has invalid structure');
		}
	}
	return mah;
}
