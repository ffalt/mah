import {CompactMapping, CompactMappingX, CompactMappingY, ImportLayout, Mapping, Place} from './types';

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
	const layout: ImportLayout = {name, cat: 'Import', mapping: []};
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

export async function convertKyodai(data: string): Promise<ImportLayout> {
	// unify line endings
	const lines = data.replace(/\r\n/g, '\n').split('\n');
	const version = lines[0] || '';
	if (['Kyodai 3.0', 'Kyodai 6.0'].includes(version)) {
		const nameCat = (lines[1] || '').split('::');
		const name = nameCat[0] || '';
		const cat = nameCat[1];
		const board = lines[2] || '';
		const layout = await convert3400Matrix(name, board);
		layout.cat = cat || layout.cat;
		return layout;
	}
	return Promise.reject(Error(`Unknown .lay format ${  JSON.stringify((version || '').slice(0, 50))}`));
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

export function expandMapping(map: CompactMapping): Mapping {
	const result: Mapping = [];
	map.forEach(matrix => {
		const z = matrix[0] as number;
		const rows = matrix[1] as Array<CompactMappingY>;
		rows.forEach(row => {
			const y = row[0] as number;
			const cells = row[1] as CompactMappingX;
			if (!Array.isArray(cells)) {
				result.push([z, cells, y]);
			} else {
				cells.forEach(cell => {
					if (Array.isArray(cell)) {
						let x = cell[0];
						const count = cell[1];
						for (let i = 0; i < count; i++) {
							result.push([z, x, y]);
							x += 2;
						}
					} else {
						result.push([z, cell, y]);
					}
				});
			}
		});
	});
	return result;
}

export function compactMapping(mapping: Mapping): CompactMapping {
	const board: any = {};
	sortMapping(mapping).forEach(m => {
		board[m[0]] = board[m[0]] || {};
		board[m[0]][m[2]] = board[m[0]][m[2]] || [];
		board[m[0]][m[2]].push(m[1]);
	});
	const result: CompactMapping = [];
	for (const z of Object.keys(board)) {
		const rows: Array<CompactMappingY> = [];
		for (const y of Object.keys(board[z])) {
			const a: Array<number> = board[z][y];
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

export function cleanImportLayout(layout: ImportLayout): ImportLayout {
	layout.name = layout.name.trim();

	// split author
	const sl = layout.name.split(' by ');
	if (sl.length > 1) {
		layout.name = sl[0].trim();
		layout.by = sl[1].trim();
	}

	// Capitalize
	layout.name = layout.name.split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');

	// move board to left/top/min z-index
	let minZ: number = layout.mapping[0][0];
	let minX: number = layout.mapping[0][1];
	let minY: number = layout.mapping[0][2];
	layout.mapping.forEach(p => {
		minZ = Math.min(p[0], minZ);
		minX = Math.min(p[1], minX);
		minY = Math.min(p[2], minY);
	});
	layout.mapping.forEach(p => {
		p[0] = p[0] - (minZ || 0);
		p[1] = p[1] - (minX || 0);
		p[2] = p[2] - (minY || 0);
	});
	return layout;
}

export function expandMappingDeprecated(mapping: Mapping): Mapping {
	const result: Mapping = [];
	if (mapping) {
		mapping.forEach(m => {
			for (let i = 0; i < (m[3] || 1); i++) {
				result.push([m[0], m[1] + (i * 2), m[2]]);
			}
		});
	}
	return result;
}

function hashString(s: string): number {
	let hash = 0;
	let i: number;
	let chr: number;
	if (s.length === 0) {
		return hash;
	}
	for (i = 0; i < s.length; i++) {
		chr = s.charCodeAt(i);
		// eslint-disable-next-line no-bitwise
		hash = ((hash << 5) - hash) + chr;
		// eslint-disable-next-line no-bitwise
		hash |= 0; // Convert to 32bit integer
	}
	return hash + 2147483647;
}

export function mappingToID(mapping: Mapping): string {
	return hashString(JSON.stringify(mapping)).toString();
}
