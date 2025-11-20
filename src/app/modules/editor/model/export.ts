import type { Layout, LoadLayout, MahFormat, Mapping } from '../../../model/types';
import { expandMapping, mappingBounds, mappingToID } from '../../../model/mapping';
import { Matrix } from './matrix';
import { compactMapping, optimizeMapping } from './import';

export function generateExportMah(layout: Layout): string {
	return generateExportMahLayouts([layout]);
}

export function generateExportMahLayouts(layouts: Array<Layout>): string {
	return JSON.stringify(generateExportMahJSON(layouts));
}

export function generateExportLayout(layout: Layout): LoadLayout {
	const mapping = expandMapping(compactMapping(optimizeMapping(layout.mapping)));
	return {
		id: mappingToID(mapping),
		name: layout.name,
		by: !layout.by || layout.by.length === 0 ? undefined : layout.by,
		cat: !layout.category || layout.category.length === 0 ? undefined : layout.category,
		map: compactMapping(mapping)
	};
}

export function generateExportMahJSON(layouts: Array<Layout>): MahFormat {
	const boards = layouts.map(layout => generateExportLayout(layout));
	return { mah: '1.0', boards };
}

export function generateExportKmahjongg(layout: Layout): string {
	const matrix = new Matrix();
	const bounds = mappingBounds(layout.mapping, 0, 0, 0);
	matrix.init(bounds.x + 1, bounds.y + 1, bounds.z);
	for (const place of layout.mapping) {
		const z = place[0];
		const x = place[1];
		const y = place[2];
		matrix.setValue(z, x, y, 1);
		matrix.setValue(z, x + 1, y, 2);
		matrix.setValue(z, x, y + 1, 4);
		matrix.setValue(z, x + 1, y + 1, 3);
	}
	const result: Array<string> = [
		'mahjongg-layout-v1.1',
		`# name: ${layout.name}`,
		`# by: ${layout.by}`,
		`# category: ${layout.category}`,
		'# Board size in quarter tiles',
		`w${bounds.x + 1}`,
		`h${bounds.y + 1}`,
		'# Board depth',
		`d${bounds.z}`
	];
	for (const [z, level] of matrix.levels.entries()) {
		const t = `# Level ${z} `;
		result.push(`${t}${'-'.repeat(Math.max(bounds.x - t.length, 0))}`);
		for (let y = 0; y <= bounds.y; y++) {
			const line = [];
			for (let x = 0; x <= bounds.x; x++) {
				line.push(level[x][y] || '.');
			}
			result.push(line.join(''));
		}
	}
	return result.join('\n');
}

export function centerMappingBounds(mapping: Mapping, width: number, height: number): Mapping {
	const bounds = mappingBounds(mapping, 0, 0, 0);
	const diffY = Math.max(0, Math.floor((height - bounds.y) / 2));
	const diffX = Math.max(0, Math.floor((width - bounds.x) / 2));
	return mapping.map(place => [place[0], place[1] + diffX, place[2] + diffY]);
}

function createKyodai6Mapping(mapping: Mapping): string {
	const matrix = new Matrix();
	const height = 20;
	const width = 34;
	const levels = 5;
	const centered = centerMappingBounds(mapping, width, height);
	matrix.applyMapping(centered, levels, width, height);
	const result: Array<string> = [];
	for (let z = 0; z < levels; z++) {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				result.push(matrix.get(z, x, y).toString());
			}
		}
	}
	return result.join('');
}

export function generateExportKyodai(layout: Layout): string {
	const by = layout.by ? ` by ${layout.by}` : '';
	const cat = layout.category ? ` :: ${layout.category}` : '';
	return `Kyodai 6.0\n${layout.name}${by}${cat}\n${createKyodai6Mapping(layout.mapping)}\n`;
}

export function downloadMahLayouts(layouts: Array<Layout>): void {
	downloadLayout('mah-layouts.mah', generateExportMahLayouts(layouts), 'text/json');
}

export function downloadLayout(filename: string, content: string, type: string): void {
	const blob = new Blob([content], { type });
	const a = document.createElement('a');
	a.href = window.URL.createObjectURL(blob);
	a.download = filename;
	a.click();
}
