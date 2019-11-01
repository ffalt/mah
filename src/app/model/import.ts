import {Mapping, Place} from './layouts';

export interface ImportLayout {
	name: string;
	by?: string;
	cat: string;
	mapping: Mapping;
}

function sortMapping(mapping: Mapping): Mapping {
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
		return Promise.reject('Invalid Matrix Pattern length');
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
	return Promise.reject('Unknown .lay format ' + JSON.stringify((version || '').slice(0, 50)));
}

export function compactMapping(mapping: Mapping): Mapping {
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

	// move board to left/top
	let minX: number = layout.mapping[0][1];
	let minY: number = layout.mapping[0][2];
	layout.mapping.forEach(p => {
		minX = Math.min(p[1], minX);
		minY = Math.min(p[2], minY);
	});
	layout.mapping.forEach(p => {
		p[1] = p[1] - (minX || 0);
		p[2] = p[2] - (minY || 0);
	});
	return layout;
}
