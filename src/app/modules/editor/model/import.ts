import type { CompactMapping, CompactMappingX, CompactMappingY, ImportLayout, LoadLayout, MahFormat, Mapping, Place } from '../../../model/types';
import { mappingToID } from '../../../model/mapping';
import { optimizeMapping } from './optimize';

export function sortMapping(mapping: Mapping): Mapping {
	return mapping.sort((a: Place, b: Place): number => {
		if (a[0] < b[0]) {
			return -1;
		}
		if (a[0] > b[0]) {
			return 1;
		}
		if (a[1] < b[1]) {
			return -1;
		}
		if (a[1] > b[1]) {
			return 1;
		}
		if (a[2] < b[2]) {
			return -1;
		}
		if (a[2] > b[2]) {
			return 1;
		}
		return 0;
	});
}

export async function convertMatrix(
	matrixCount: number, rowCount: number, cellCount: number,
	name: string, board: string): Promise<ImportLayout> {
	const matrixLength: number = rowCount * cellCount;
	const totalLength: number = matrixLength * matrixCount;
	if (board.length !== totalLength) {
		return Promise.reject(new Error('Invalid Matrix Pattern length'));
	}
	const layout: ImportLayout = { name, cat: 'Kyodai', mapping: [] };
	for (let z = 0; z < matrixCount; z++) {
		const matrix = board.slice(z * matrixLength, (z + 1) * matrixLength);
		for (let y = 0; y < rowCount; y++) {
			const row = matrix.slice(y * cellCount, (y + 1) * cellCount);
			const cells = [...row];
			for (const [x, cell] of cells.entries()) {
				if (cell === '1') {
					layout.mapping.push([z, x, y]);
				}
			}
		}
	}
	return layout;
}

export async function convert3400Matrix(name: string, board: string): Promise<ImportLayout> {
	return convertMatrix(5, 20, 34, name, board);
}

export async function convert2805Matrix(name: string, board: string): Promise<ImportLayout> {
	return convertMatrix(5, 17, 33, name, board);
}

export async function convertKmahjonggLines(lines: Array<string>, height: number): Promise<Mapping> {
	const result: Mapping = [];
	for (const [index, line] of lines.entries()) {
		const z = Math.floor(index / height);
		const y = (index % height);
		for (const [x, c] of [...line].entries()) {
			if (c === '1') {
				result.push([z, x, y]);
			}
		}
	}
	return result;
}

export async function convertKmahjongg(data: string, filename: string): Promise<ImportLayout> {
	let lines = data.replace(/\r\n/g, '\n').split('\n');
	const names = filename.split('.');
	names.pop();
	const version = lines.shift() ?? '';
	const layout: ImportLayout = {
		name: names.join('.').replace(/_/g, ' '),
		cat: 'uncategorized',
		mapping: []
	};
	if (['kmahjongg-layout-v1.0'].includes(version)) {
		layout.by = 'KDE Games team';
		layout.mapping = await convertKmahjonggLines(lines.filter(line => !line.startsWith('#')), 16);
		return layout;
	}
	if (['kmahjongg-layout-v1.1'].includes(version)) {
		// eslint-disable-next-line unicorn/prefer-spread
		const h = Number((lines.find(line => line.startsWith('h')) ?? 'h16').split('').slice().join(''));
		const name = (lines.find(line => line.startsWith('# name:')) ?? '').slice(7).trim();
		layout.name = name ?? layout.name;
		layout.name = layout.name.length === 0 ? filename.split('.')[0] : layout.name;
		const by = (lines.find(line => line.startsWith('# by:')) ?? '').slice(5).trim();
		layout.by = by || layout.by;
		lines = lines.filter(line => !line.startsWith('h') && !line.startsWith('w') && !line.startsWith('d') && !line.startsWith('#'));
		layout.mapping = await convertKmahjonggLines(lines, Number.isNaN(h) ? 16 : h);
		return layout;
	}
	return Promise.reject(new Error(`Unknown .layout format ${JSON.stringify((version ?? '').slice(0, 50))}`));
}

export async function convertKyodai(data: string, filename: string): Promise<ImportLayout> {
	// unify line endings
	const lines = data.replace(/\r\n/g, '\n').split('\n');
	const version = lines[0] || '';
	if (['Kyodai 3.0', 'Kyodai 6.0'].includes(version)) {
		const nameCat = (lines[1] || '').split('::');
		const name = nameCat[0].length === 0 ? filename.split('.')[0] : nameCat[0];
		const cat = nameCat[1] || 'uncategorized';
		const board = lines[2] || '';
		const layout = await convert3400Matrix(name, board);
		layout.cat = cat || layout.cat;
		return layout;
	}
	return Promise.reject(new Error(`Unknown .lay format ${JSON.stringify((version || '').slice(0, 50))}`));
}

interface MappingBoard {
	[key: number]: { [key: number]: Array<number> };
}

function createCompactMappingBoard(mapping: Mapping): MappingBoard {
	const board: MappingBoard = {};
	const list = sortMapping(mapping);
	for (const m of list) {
		board[m[0]] = board[m[0]] || {};
		board[m[0]][m[2]] = board[m[0]][m[2]] || [];
		board[m[0]][m[2]].push(m[1]);
	}
	return board;
}

export function compactY(z: number, y: number, board: MappingBoard): CompactMappingY {
	const a: Array<number> = board[z][y];
	const entries: Array<{ start: number; current: number; count: number }> = [];
	let entry = { start: -1, current: -1, count: 0 };
	for (const x of a) {
		if (x === entry.current) {
			entry.current += 2;
			entry.count++;
		} else {
			entry = { start: x, current: x + 2, count: 1 };
			entries.push(entry);
		}
	}
	const cells: CompactMappingX = entries.map(mappingEntry => {
		if (mappingEntry.count === 1) {
			return mappingEntry.start;
		}
		return [mappingEntry.start, mappingEntry.count];
	});
	return [Number(y), (cells.length === 1 && !Array.isArray(cells[0])) ? cells[0] : cells];
}

export function compactMapping(mapping: Mapping): CompactMapping {
	const board = createCompactMappingBoard(mapping);
	const result: CompactMapping = [];
	for (const z of Object.keys(board)) {
		const rows: Array<CompactMappingY> = [];
		for (const y of Object.keys(board[Number(z)])) {
			rows.push(compactY(Number(z), Number(y), board));
		}
		result.push([Number(z), rows]);
	}
	return result;
}

export function cleanNameCapitalized(s: string): string {
	return s.trim().split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')
		.replace(/"/g, '')
		.replace(/(^'|'$)/gm, '');
}

export function cleanImportLayout(layout: ImportLayout): LoadLayout {
	// split author
	const sl = layout.name.split(' by ');
	if (sl.length > 1) {
		layout.name = sl[0].trim();
		layout.by = sl[1].trim();
	}
	// Capitalize
	layout.name = cleanNameCapitalized(layout.name || '');
	layout.by = layout.by ? cleanNameCapitalized(layout.by) : undefined;
	const map = optimizeMapping(layout.mapping);
	return {
		id: mappingToID(map),
		name: layout.name.trim(),
		cat: layout.cat.trim(),
		by: layout.by,
		map: compactMapping(map)
	};
}

export async function readFile(file: File): Promise<string> {
	const reader = new FileReader();
	return new Promise<string>((resolve, reject) => {
		reader.addEventListener('load', () => {
			resolve(reader.result as string);
		});
		reader.addEventListener('error', event => {
			reject(new Error(`Reading File failed: ${event?.target?.error?.message ?? 'unknown error'}`));
		});
		reader.readAsText(file, 'ascii');
	});
}

export async function importLayouts(file: File): Promise<Array<LoadLayout>> {
	const data = await readFile(file);
	const extension = (file.name.split('.').pop() ?? '').toLowerCase();
	let layout: LoadLayout;
	if (extension === 'lay') {
		layout = cleanImportLayout(await convertKyodai(data, file.name));
	} else if (extension === 'layout') {
		layout = cleanImportLayout(await convertKmahjongg(data, file.name));
	} else {
		const mah: MahFormat = JSON.parse(data);
		// TODO: validate
		return mah.boards;
	}
	return [layout];
}
