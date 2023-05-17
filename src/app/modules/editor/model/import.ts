import {CompactMapping, CompactMappingX, CompactMappingY, ImportLayout, LoadLayout, MahFormat, Mapping, Place} from '../../../model/types';
import {mappingToID} from '../../../model/mapping';

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

async function convertMatrix(
	matrixCount: number, rowCount: number, cellCount: number,
	name: string, board: string): Promise<ImportLayout> {
	const matrixLength: number = rowCount * cellCount;
	const totalLength: number = matrixLength * matrixCount;
	if (board.length !== totalLength) {
		return Promise.reject(Error('Invalid Matrix Pattern length'));
	}
	const layout: ImportLayout = {name, cat: 'Kyodai', mapping: []};
	for (let z = 0; z < matrixCount; z++) {
		const matrix = board.slice(z * matrixLength, (z + 1) * matrixLength);
		for (let y = 0; y < rowCount; y++) {
			const row = matrix.slice(y * cellCount, (y + 1) * cellCount);
			row.split('').forEach((cell, x) => {
				if (cell === '1') {
					layout.mapping.push([z, x, y]);
				}
			});
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
	lines.forEach((line, index) => {
		const z = Math.floor(index / height);
		const y = (index % height);
		line.split('').forEach((c, x) => {
			if (c === '1') {
				result.push([z, x, y]);
			}
		});
	});
	return result;
}

export async function convertKmahjongg(data: string, filename: string): Promise<ImportLayout> {
	let lines = data.replace(/\r\n/g, '\n').split('\n');
	const names = filename.split('.');
	names.pop();
	const version = lines.shift() || '';
	const layout: ImportLayout = {
		name: names.join('.').replace(/_/g, ' '),
		cat: 'uncategorized',
		mapping: []
	};
	if (['kmahjongg-layout-v1.0'].includes(version)) {
		layout.by = 'KDE Games team';
		layout.mapping = await convertKmahjonggLines(lines.filter(line => !line.startsWith('#')), 16);
		return layout;
	} else if (['kmahjongg-layout-v1.1'].includes(version)) {
		const h = Number((lines.find(line => line.startsWith('h')) || 'h16').split('').slice().join(''));
		const name = (lines.find(line => line.startsWith('# name:')) || '').slice(7).trim();
		layout.name = name || layout.name;
		const by = (lines.find(line => line.startsWith('# by:')) || '').slice(5).trim();
		layout.by = by || layout.by;
		lines = lines.filter(line => !line.startsWith('h') && !line.startsWith('w') && !line.startsWith('d') && !line.startsWith('#'));
		layout.mapping = await convertKmahjonggLines(lines, isNaN(h) ? 16 : h);
		return layout;
	}
	return Promise.reject(Error(`Unknown .layout format ${JSON.stringify((version || '').slice(0, 50))}`));
}

export async function convertKyodai(data: string, filename: string): Promise<ImportLayout> {
	// unify line endings
	const lines = data.replace(/\r\n/g, '\n').split('\n');
	const version = lines[0] || '';
	if (['Kyodai 3.0', 'Kyodai 6.0'].includes(version)) {
		const nameCat = (lines[1] || '').split('::');
		const name = nameCat[0] || '';
		const cat = nameCat[1] || 'uncategorized';
		const board = lines[2] || '';
		const layout = await convert3400Matrix(name, board);
		layout.cat = cat || layout.cat;
		return layout;
	}
	return Promise.reject(Error(`Unknown .lay format ${JSON.stringify((version || '').slice(0, 50))}`));
}

/*
export function compactMappingDeprecated(mapping: Mapping): Mapping {
	let maplist: Mapping = [];
	mapping.forEach(o => {
		const place: Array<number> = [];
		for (let i = 0; i < 4; i++) {
			place.push(o[i]);
		}
		maplist.push(place);
	});
	maplist = sortMapping(maplist);
	const result: Mapping = [];
	for (let i = maplist.length - 1; i >= 1; i--) {
		const item = maplist[i];
		const before = maplist[i - 1];
		if (before && (item[0] === before[0]) && (item[2] === before[2]) && (item[1] - 2 === before[1])) {
			before[3] = (before[3] || 1) + (item[3] || 1);
		} else if ((item[3] || 1) === 1) {
			result.unshift([item[0], item[1], item[2]]);
		} else {
			result.unshift(item);
		}
	}
	const first = maplist[0];
	result.unshift([first[0], first[1], first[2]]);
	return result;
}
*/

export function compactMapping(mapping: Mapping): CompactMapping {
	const board: { [key: number]: { [key: number]: Array<number> } } = {};
	sortMapping(mapping).forEach(m => {
		board[m[0]] = board[m[0]] || {};
		board[m[0]][m[2]] = board[m[0]][m[2]] || [];
		board[m[0]][m[2]].push(m[1]);
	});
	const result: CompactMapping = [];
	for (const z of Object.keys(board)) {
		const rows: Array<CompactMappingY> = [];
		for (const y of Object.keys(board[Number(z)])) {
			const a: Array<number> = board[Number(z)][Number(y)];
			const entries: Array<{ start: number; current: number; count: number }> = [];
			let entry = {start: -1, current: -1, count: 0};
			a.forEach(x => {
				if (x !== entry.current) {
					entry = {start: x, current: x + 2, count: 1};
					entries.push(entry);
				} else {
					entry.current += 2;
					entry.count++;
				}
			});
			const cells: CompactMappingX = entries.map(e => {
				if (e.count === 1) {
					return e.start;
				}
				return [e.start, e.count];
			});
			if (cells.length === 1 && !Array.isArray(cells[0])) {
				rows.push([Number(y), cells[0]]);
			} else {
				rows.push([Number(y), cells]);
			}
		}
		result.push([Number(z), rows]);
	}
	return result;
}

export function cleanImportLayout(layout: ImportLayout): LoadLayout {
	// split author
	const sl = layout.name.split(' by ');
	if (sl.length > 1) {
		layout.name = sl[0].trim();
		layout.by = sl[1].trim();
	}
	// Capitalize
	layout.name = layout.name.trim().split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ').replace(/["']/g, '');
	layout.by = layout.by ? layout.by.trim().split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ').replace(/["]/g, '') : undefined;
	const map = optimizeMapping(layout.mapping);
	return {
		id: mappingToID(map),
		name: layout.name.trim(),
		cat: layout.cat,
		by: layout.by,
		map: compactMapping(map)
	};
}

export function optimizeMapping(mapping: Mapping): Mapping {
	if (mapping.length === 0) {
		return [];
	}
	// move board to left/top/min z-index
	let minZ: number = mapping[0][0];
	let minX: number = mapping[0][1];
	let minY: number = mapping[0][2];
	mapping.forEach(p => {
		minZ = Math.min(p[0], minZ);
		minX = Math.min(p[1], minX);
		minY = Math.min(p[2], minY);
	});
	return mapping.map(p => [p[0] - (minZ || 0), p[1] - (minX || 0), p[2] - (minY || 0)]);
}

export async function readFile(file: File): Promise<string> {
	const reader = new FileReader();
	return new Promise<string>((resolve, reject) => {
		reader.onload = () => {
			resolve(reader.result as string);
		};
		reader.onerror = () => {
			reject(Error(`Reading File failed: ${reader.error}`));
		};
		reader.readAsBinaryString(file);
	});
}

export async function importLayouts(file: File): Promise<Array<LoadLayout>> {
	const data = await readFile(file);
	const ext = (file.name.split('.').pop() || '').toLowerCase();
	let layout: LoadLayout;
	if (ext === 'lay') {
		layout = cleanImportLayout(await convertKyodai(data, file.name));
	} else if (ext === 'layout') {
		layout = cleanImportLayout(await convertKmahjongg(data, file.name));
	} else {
		const mah: MahFormat = JSON.parse(data);
		// TODO: validate
		return mah.boards;
	}
	return [layout];
}
