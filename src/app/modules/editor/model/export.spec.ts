import type { Layout, Mapping } from '../../../model/types';
import {
	centerMappingBounds,
	downloadLayout,
	downloadMahLayouts,
	generateExportKmahjongg,
	generateExportKyodai
} from './export';

function makeLayout(overrides: Partial<Layout> = {}): Layout {
	return {
		id: 'test-id',
		name: 'Test Layout',
		category: 'test-cat',
		by: 'Test Author',
		mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Mapping,
		...overrides
	};
}

describe('generateExportKmahjongg', () => {
	it('should start with the kmahjongg header line', () => {
		const result = generateExportKmahjongg(makeLayout());
		expect(result.startsWith('mahjongg-layout-v1.1')).toBe(true);
	});

	it('should contain the layout name', () => {
		const result = generateExportKmahjongg(makeLayout({ name: 'My Board' }));
		expect(result).toContain('# name: My Board');
	});

	it('should contain the by line', () => {
		const result = generateExportKmahjongg(makeLayout({ by: 'Some Author' }));
		expect(result).toContain('# by: Some Author');
	});

	it('should contain the category line', () => {
		const result = generateExportKmahjongg(makeLayout({ category: 'Misc' }));
		expect(result).toContain('# category: Misc');
	});

	it('should contain the width declaration', () => {
		const layout = makeLayout({ mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Mapping });
		const result = generateExportKmahjongg(layout);
		expect(result).toContain('w8');
	});

	it('should contain the height declaration', () => {
		const layout = makeLayout({ mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Mapping });
		const result = generateExportKmahjongg(layout);
		expect(result).toContain('h2');
	});

	it('should contain the depth declaration', () => {
		const layout = makeLayout({ mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Mapping });
		const result = generateExportKmahjongg(layout);
		expect(result).toContain('d1');
	});

	it('should contain Level 0 header', () => {
		const result = generateExportKmahjongg(makeLayout());
		expect(result).toContain('# Level 0 ');
	});

	it('should produce newline-separated lines', () => {
		const result = generateExportKmahjongg(makeLayout());
		const lines = result.split('\n');
		expect(lines.length).toBeGreaterThan(5);
	});
});

describe('centerMappingBounds', () => {
	it('should offset x and y to center the mapping in the given dimensions', () => {
		const mapping: Mapping = [[0, 0, 0]];
		const result = centerMappingBounds(mapping, 10, 10);
		expect(result[0][1]).toBeGreaterThan(0);
		expect(result[0][2]).toBeGreaterThan(0);
	});

	it('should not shift below zero when mapping is larger than the target', () => {
		const mapping: Mapping = [[0, 0, 0], [0, 20, 20]];
		const result = centerMappingBounds(mapping, 5, 5);
		expect(result[0][1]).toBeGreaterThanOrEqual(0);
		expect(result[0][2]).toBeGreaterThanOrEqual(0);
	});

	it('should preserve z coordinate unchanged', () => {
		const mapping: Mapping = [[2, 0, 0]];
		const result = centerMappingBounds(mapping, 10, 10);
		expect(result[0][0]).toBe(2);
	});

	it('should return the same number of tiles', () => {
		const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 2]];
		const result = centerMappingBounds(mapping, 20, 20);
		expect(result).toHaveLength(3);
	});

	it('should return an empty mapping when input is empty', () => {
		const result = centerMappingBounds([], 10, 10);
		expect(result).toHaveLength(0);
	});

	it('should apply equal offset to all tiles', () => {
		const mapping: Mapping = [[0, 0, 0], [0, 2, 0]];
		const result = centerMappingBounds(mapping, 20, 20);
		const xDiff = result[1][1] - result[0][1];
		expect(xDiff).toBe(2);
	});
});

describe('generateExportKyodai', () => {
	it('should start with Kyodai 6.0 header', () => {
		const result = generateExportKyodai(makeLayout());
		expect(result.startsWith('Kyodai 6.0\n')).toBe(true);
	});

	it('should contain the layout name on the second line', () => {
		const result = generateExportKyodai(makeLayout({ name: 'Dragon' }));
		const lines = result.split('\n');
		expect(lines[1].startsWith('Dragon')).toBe(true);
	});

	it('should contain by info on second line when present', () => {
		const result = generateExportKyodai(makeLayout({ name: 'Dragon', by: 'Me' }));
		const lines = result.split('\n');
		expect(lines[1]).toContain(' by Me');
	});

	it('should contain category info when present', () => {
		const result = generateExportKyodai(makeLayout({ name: 'Dragon', category: 'Fun' }));
		const lines = result.split('\n');
		expect(lines[1]).toContain(' :: Fun');
	});

	it('should omit by info when by is undefined', () => {
		const result = generateExportKyodai(makeLayout({ by: undefined }));
		const lines = result.split('\n');
		expect(lines[1]).not.toContain(' by ');
	});

	it('should omit category info when category is undefined', () => {
		const result = generateExportKyodai(makeLayout({ category: undefined }));
		const lines = result.split('\n');
		expect(lines[1]).not.toContain(' :: ');
	});

	it('should produce a matrix string of exactly 3400 characters on the third line', () => {
		const result = generateExportKyodai(makeLayout());
		const lines = result.split('\n');
		expect(lines[2]).toHaveLength(3400);
	});

	it('should end with a newline', () => {
		const result = generateExportKyodai(makeLayout());
		expect(result.endsWith('\n')).toBe(true);
	});
});

describe('downloadLayout', () => {
	let mockClick: jest.Mock;
	let createObjectURLSpy: jest.Mock;
	let createElementSpy: jest.SpyInstance;

	beforeEach(() => {
		mockClick = jest.fn();
		const mockAnchor = { href: '', download: '', click: mockClick };
		createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
		createObjectURLSpy = jest.fn().mockReturnValue('blob:url');
		(window.URL as Record<string, unknown>).createObjectURL = createObjectURLSpy;
	});

	afterEach(() => {
		createElementSpy.mockRestore();
	});

	it('should set href from createObjectURL', () => {
		const mockAnchor = { href: '', download: '', click: mockClick };
		createElementSpy.mockReturnValue(mockAnchor);

		downloadLayout('file.mah', 'content', 'text/json');

		expect(mockAnchor.href).toBe('blob:url');
	});

	it('should set the download attribute to the filename', () => {
		const mockAnchor = { href: '', download: '', click: mockClick };
		createElementSpy.mockReturnValue(mockAnchor);

		downloadLayout('my-file.mah', 'content', 'text/json');

		expect(mockAnchor.download).toBe('my-file.mah');
	});

	it('should call click on the anchor element', () => {
		downloadLayout('file.mah', 'content', 'text/json');

		expect(mockClick).toHaveBeenCalled();
	});

	it('should call createObjectURL with a Blob', () => {
		downloadLayout('file.mah', 'data', 'text/plain');

		expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
	});
});

describe('downloadMahLayouts', () => {
	let mockClick: jest.Mock;
	let createElementSpy: jest.SpyInstance;

	beforeEach(() => {
		mockClick = jest.fn();
		const mockAnchor = { href: '', download: '', click: mockClick };
		createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
		(window.URL as Record<string, unknown>).createObjectURL = jest.fn().mockReturnValue('blob:url');
	});

	afterEach(() => {
		createElementSpy.mockRestore();
	});

	it('should trigger a download with filename mah-layouts.mah', () => {
		const mockAnchor = { href: '', download: '', click: mockClick };
		createElementSpy.mockReturnValue(mockAnchor);

		downloadMahLayouts([makeLayout()]);

		expect(mockAnchor.download).toBe('mah-layouts.mah');
	});

	it('should call click', () => {
		downloadMahLayouts([makeLayout()]);

		expect(mockClick).toHaveBeenCalled();
	});
});
