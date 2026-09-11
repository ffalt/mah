import type { LoadLayout, MahFormat } from './types';
import { log } from './log';
import { fromBase64 } from './base64';
import { parseMahFormat } from './mah-reader';

export function parseImportString(base64jsonString: string | null): Array<LoadLayout> {
	if (!base64jsonString) {
		return [];
	}
	let decoded: string;
	try {
		decoded = fromBase64(base64jsonString);
	} catch (error) {
		log.error('Import failed: Invalid base64 encoding', 'Cause:', error);
		return [];
	}
	let mah: MahFormat;
	try {
		mah = parseMahFormat(decoded);
	} catch (error) {
		const message = (error as Error).message || 'Unknown error';
		const cause = (error as Error).cause;
		log.error('Import failed:', message, 'Cause:', cause);
		return [];
	}
	return mah.boards;
}
