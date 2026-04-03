import type { LoadLayout, MahFormat } from './types';
import { log } from './log';

export const MAX_IMPORT_BOARDS = 1000;

export function isValidLoadLayout(board: unknown): board is LoadLayout {
	if (!board || typeof board !== 'object' || Array.isArray(board)) {
		return false;
	}
	const b = board as Record<string, unknown>;
	if (typeof b.name !== 'string' || b.name.trim() === '' || b.name.length > 200) {
		return false;
	}
	if (!Array.isArray(b.map)) {
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

export function parseImportString(base64jsonString: string | null): Array<LoadLayout> {
	if (!base64jsonString) {
		return [];
	}
	try {
		let decoded: string;
		try {
			decoded = atob(base64jsonString);
		} catch (error) {
			log.warn('Import failed: Invalid base64 encoding', error);
			return [];
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(decoded);
		} catch (error) {
			log.warn('Import failed: Invalid JSON format', error);
			return [];
		}

		const mah = parsed as MahFormat;
		if (!mah.mah || mah.mah !== '1.0') {
			log.warn('Import failed: Invalid or unsupported MAH format version');
			return [];
		}

		if (!Array.isArray(mah.boards)) {
			log.warn('Import failed: Missing or invalid boards array');
			return [];
		}

		if (mah.boards.length === 0) {
			log.warn('Import failed: No boards found in import data');
			return [];
		}

		if (mah.boards.length > MAX_IMPORT_BOARDS) {
			log.warn(`Import failed: Too many boards (${mah.boards.length}), maximum is ${MAX_IMPORT_BOARDS}`);
			return [];
		}

		const result: Array<LoadLayout> = [];
		for (const board of mah.boards) {
			if (!isValidLoadLayout(board)) {
				log.warn('Import failed: Board entry has invalid structure, skipping');
				continue;
			}
			result.push(board);
		}
		return result;
	} catch (error) {
		log.error('Unexpected error during import:', error);
		return [];
	}
}
