import type { CompactMappingY, Mapping } from '../../../model/types';
import {
	cleanImportLayout,
	cleanNameCapitalized,
	compactMapping,
	compactY,
	convert2805Matrix,
	convert3400Matrix,
	convertKmahjongg,
	convertKmahjonggLines,
	convertKyodai,
	convertMatrix,
	importLayouts,
	readFile,
	sortMapping
} from './import';

describe('sortMapping', () => {
	it('should sort by z first', () => {
		const mapping: Mapping = [[1, 0, 0], [0, 0, 0]];
		const result = sortMapping(mapping);
		expect(result[0][0]).toBe(0);
		expect(result[1][0]).toBe(1);
	});

	it('should sort by x when z is equal', () => {
		const mapping: Mapping = [[0, 4, 0], [0, 2, 0]];
		const result = sortMapping(mapping);
		expect(result[0][1]).toBe(2);
		expect(result[1][1]).toBe(4);
	});

	it('should sort by y when z and x are equal', () => {
		const mapping: Mapping = [[0, 0, 3], [0, 0, 1]];
		const result = sortMapping(mapping);
		expect(result[0][2]).toBe(1);
		expect(result[1][2]).toBe(3);
	});

	it('should return same element when mapping has one entry', () => {
		const mapping: Mapping = [[2, 3, 4]];
		const result = sortMapping(mapping);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual([2, 3, 4]);
	});

	it('should handle equal elements', () => {
		const mapping: Mapping = [[0, 0, 0], [0, 0, 0]];
		const result = sortMapping(mapping);
		expect(result).toHaveLength(2);
	});
});

describe('convertMatrix', () => {
	it('should reject when board length does not match dimensions', async () => {
		await expect(convertMatrix(5, 20, 34, 'Test', 'short')).rejects.toThrow('Invalid Matrix Pattern length');
	});

	it('should parse cells with value 1 into mapping entries', async () => {
		const board = `1${'0'.repeat(5 * 20 * 34 - 1)}`;
		const result = await convertMatrix(5, 20, 34, 'Test', board);
		expect(result.mapping).toHaveLength(1);
		expect(result.mapping[0]).toEqual([0, 0, 0]);
	});

	it('should set the name on the layout', async () => {
		const board = '0'.repeat(5 * 20 * 34);
		const result = await convertMatrix(5, 20, 34, 'MyName', board);
		expect(result.name).toBe('MyName');
	});

	it('should set cat to Kyodai', async () => {
		const board = '0'.repeat(5 * 20 * 34);
		const result = await convertMatrix(5, 20, 34, 'Test', board);
		expect(result.cat).toBe('Kyodai');
	});

	it('should map a cell in level 1 correctly', async () => {
		const cellsPerMatrix = 20 * 34;
		const board = `${'0'.repeat(cellsPerMatrix)}1${'0'.repeat(cellsPerMatrix * 4 - 1)}`;
		const result = await convertMatrix(5, 20, 34, 'Test', board);
		const isFound = result.mapping.some(place => place[0] === 1 && place[1] === 0 && place[2] === 0);
		expect(isFound).toBe(true);
	});
});

describe('convert3400Matrix', () => {
	it('should reject when board length is not 3400', async () => {
		await expect(convert3400Matrix('Test', '0'.repeat(100))).rejects.toThrow();
	});

	it('should parse a 3400-char board', async () => {
		const board = '0'.repeat(3400);
		const result = await convert3400Matrix('Test', board);
		expect(result.mapping).toHaveLength(0);
	});
});

describe('convert2805Matrix', () => {
	it('should reject when board length is not 2805', async () => {
		await expect(convert2805Matrix('Test', '0'.repeat(100))).rejects.toThrow();
	});

	it('should parse a 2805-char board', async () => {
		const board = '0'.repeat(5 * 17 * 33);
		const result = await convert2805Matrix('Test', board);
		expect(result.mapping).toHaveLength(0);
	});
});

describe('convertKmahjonggLines', () => {
	it('should parse lines into mapping entries for char 1', async () => {
		const lines = ['1000', '0100'];
		const result = await convertKmahjonggLines(lines, 2);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual([0, 0, 0]);
		expect(result).toContainEqual([0, 1, 1]);
	});

	it('should produce correct z index from height grouping', async () => {
		const lines = ['0000', '0000', '1000', '0000'];
		const result = await convertKmahjonggLines(lines, 2);
		const level1Entry = result.find(place => place[0] === 1);
		expect(level1Entry).toBeDefined();
		expect(level1Entry?.[2]).toBe(0);
	});

	it('should return empty mapping for lines with no 1 chars', async () => {
		const lines = ['0000', '0000'];
		const result = await convertKmahjonggLines(lines, 2);
		expect(result).toHaveLength(0);
	});
});

describe('convertKmahjongg', () => {
	it('should parse v1.0 format', async () => {
		const data = 'kmahjongg-layout-v1.0\n1000\n0100\n';
		const result = await convertKmahjongg(data, 'test.layout');
		expect(result.mapping.length).toBeGreaterThan(0);
		expect(result.by).toBe('KDE Games team');
	});

	it('should parse v1.1 format and extract name', async () => {
		const data = [
			'kmahjongg-layout-v1.1',
			'# name: MyBoard',
			'# by: TestAuthor',
			'w5',
			'h4',
			'd1',
			'1000',
			'0100'
		].join('\n');
		const result = await convertKmahjongg(data, 'test.layout');
		expect(result.name).toBe('MyBoard');
	});

	it('should parse v1.1 format and extract by', async () => {
		const data = [
			'kmahjongg-layout-v1.1',
			'# name: MyBoard',
			'# by: TestAuthor',
			'w5',
			'h4',
			'd1',
			'1000'
		].join('\n');
		const result = await convertKmahjongg(data, 'test.layout');
		expect(result.by).toBe('TestAuthor');
	});

	it('should use filename as name when v1.1 name is empty', async () => {
		const data = [
			'kmahjongg-layout-v1.1',
			'# name: ',
			'w5',
			'h4',
			'd1',
			'1000'
		].join('\n');
		const result = await convertKmahjongg(data, 'fallback.layout');
		expect(result.name).toBe('fallback');
	});

	it('should reject unknown version', async () => {
		await expect(convertKmahjongg('unknown-version-v9.9\n1000', 'test.layout')).rejects.toThrow('Unknown .layout format');
	});

	it('should handle Windows CRLF line endings in v1.0', async () => {
		const data = 'kmahjongg-layout-v1.0\r\n1000\r\n0100\r\n';
		const result = await convertKmahjongg(data, 'test.layout');
		expect(result.mapping.length).toBeGreaterThan(0);
	});
});

describe('convertKyodai', () => {
	function make3400Board(overrides: Record<number, string> = {}): string {
		const chars = Array.from({ length: 3400 }, () => '0');
		for (const [index, value] of Object.entries(overrides)) {
			chars[Number(index)] = value;
		}
		return chars.join('');
	}

	it('should parse Kyodai 6.0 format', async () => {
		const board = make3400Board();
		const data = `Kyodai 6.0\nTestName\n${board}\n`;
		const result = await convertKyodai(data, 'test.lay');
		expect(result.name).toBe('TestName');
	});

	it('should parse Kyodai 3.0 format', async () => {
		const board = make3400Board();
		const data = `Kyodai 3.0\nTestName\n${board}\n`;
		const result = await convertKyodai(data, 'test.lay');
		expect(result.name).toBe('TestName');
	});

	it('should extract category from name line', async () => {
		const board = make3400Board();
		const data = `Kyodai 6.0\nName :: MyCat\n${board}\n`;
		const result = await convertKyodai(data, 'test.lay');
		expect(result.cat).toBe(' MyCat');
	});

	it('should reject unknown version', async () => {
		const board = make3400Board();
		await expect(convertKyodai(`Unknown 1.0\nName\n${board}\n`, 'test.lay')).rejects.toThrow('Unknown .lay format');
	});

	it('should use filename when name line is empty', async () => {
		const board = make3400Board();
		const data = `Kyodai 6.0\n\n${board}\n`;
		const result = await convertKyodai(data, 'fallback.lay');
		expect(result.name).toBe('fallback');
	});
});

describe('compactY', () => {
	it('should return a single x value directly when there is one tile', () => {
		const board = { 0: { 0: [4] } };
		const result: CompactMappingY = compactY(0, 0, board);
		expect(result[0]).toBe(0);
		expect(result[1]).toBe(4);
	});

	it('should run-length encode consecutive x values stepping by 2', () => {
		const board = { 0: { 0: [0, 2, 4] } };
		const result: CompactMappingY = compactY(0, 0, board);
		expect(result[0]).toBe(0);
		expect(result[1]).toEqual([[0, 3]]);
	});

	it('should return array of values for non-consecutive x values', () => {
		const board = { 0: { 0: [0, 6] } };
		const result: CompactMappingY = compactY(0, 0, board);
		expect(result[0]).toBe(0);
		expect(result[1]).toEqual([0, 6]);
	});

	it('should handle multiple runs', () => {
		const board = { 0: { 0: [0, 2, 10, 12] } };
		const result: CompactMappingY = compactY(0, 0, board);
		expect(Array.isArray(result[1])).toBe(true);
	});
});

describe('compactMapping', () => {
	it('should return an empty array for an empty mapping', () => {
		const result = compactMapping([]);
		expect(result).toHaveLength(0);
	});

	it('should return a compact structure for a simple mapping', () => {
		const mapping: Mapping = [[0, 0, 0]];
		const result = compactMapping(mapping);
		expect(result).toHaveLength(1);
		expect(result[0][0]).toBe(0);
	});

	it('should group tiles by z level', () => {
		const mapping: Mapping = [[0, 0, 0], [1, 0, 0]];
		const result = compactMapping(mapping);
		expect(result).toHaveLength(2);
	});
});

describe('cleanNameCapitalized', () => {
	it('should capitalize each word', () => {
		expect(cleanNameCapitalized('hello world')).toBe('Hello World');
	});

	it('should remove surrounding single quotes', () => {
		expect(cleanNameCapitalized('\'hello\'')).toBe('hello');
	});

	it('should remove double quotes', () => {
		expect(cleanNameCapitalized('"hello"')).toBe('hello');
	});

	it('should trim surrounding whitespace', () => {
		expect(cleanNameCapitalized('  hello  ')).toBe('Hello');
	});

	it('should handle single word', () => {
		expect(cleanNameCapitalized('dragon')).toBe('Dragon');
	});
});

describe('cleanImportLayout', () => {
	it('should split name by by and assign author', () => {
		const result = cleanImportLayout({
			name: 'MyBoard by Some Author',
			cat: 'test',
			mapping: []
		});
		expect(result.name).toBe('MyBoard');
		expect(result.by).toBe('Some Author');
	});

	it('should capitalize the name', () => {
		const result = cleanImportLayout({
			name: 'my board',
			cat: 'test',
			mapping: []
		});
		expect(result.name).toBe('My Board');
	});

	it('should trim the cat field', () => {
		const result = cleanImportLayout({
			name: 'test',
			cat: '  Misc  ',
			mapping: []
		});
		expect(result.cat).toBe('Misc');
	});

	it('should produce an id', () => {
		const result = cleanImportLayout({ name: 'Test', cat: 'cat', mapping: [[0, 0, 0]] });
		expect(typeof result.id).toBe('string');
		expect(result.id.length).toBeGreaterThan(0);
	});

	it('should include a compact map', () => {
		const result = cleanImportLayout({ name: 'Test', cat: 'cat', mapping: [[0, 0, 0]] });
		expect(Array.isArray(result.map)).toBe(true);
	});
});

type FileReaderHandler = (event: ProgressEvent<FileReader>) => void;

let fakeReaderContent = '';
let shouldFakeReaderFail = false;

class FakeFileReader {
	private readonly handlers = new Map<string, FileReaderHandler>();

	get result(): string | null {
		return shouldFakeReaderFail ? null : fakeReaderContent;
	}

	addEventListener(event: string, handler: FileReaderHandler): void {
		this.handlers.set(event, handler);
	}

	readAsText(_file: File, _encoding: string): void {
		setTimeout(() => {
			if (shouldFakeReaderFail) {
				const fakeEvent = {
					target: { error: { message: 'read error' } }
				} as unknown as ProgressEvent<FileReader>;
				this.handlers.get('error')?.(fakeEvent);
			} else {
				this.handlers.get('load')?.({ target: this } as ProgressEvent<FileReader>);
			}
		}, 0);
	}
}

describe('readFile', () => {
	let originalFileReader: typeof FileReader;

	beforeEach(() => {
		originalFileReader = global.FileReader;
		(global as Record<string, unknown>).FileReader = FakeFileReader;
	});

	afterEach(() => {
		(global as Record<string, unknown>).FileReader = originalFileReader;
	});

	it('should resolve with file content on success', async () => {
		fakeReaderContent = 'file content';
		shouldFakeReaderFail = false;
		const file = new File(['file content'], 'test.txt');
		const result = await readFile(file);
		expect(result).toBe('file content');
	});

	it('should reject with error message on read error', async () => {
		shouldFakeReaderFail = true;
		const file = new File(['data'], 'test.txt');
		await expect(readFile(file)).rejects.toThrow('Reading File failed');
	});
});

describe('importLayouts', () => {
	let originalFileReader: typeof FileReader;

	function makeFile(content: string, name: string): File {
		return new File([content], name, { type: 'text/plain' });
	}

	beforeEach(() => {
		originalFileReader = global.FileReader;
		shouldFakeReaderFail = false;
		(global as Record<string, unknown>).FileReader = FakeFileReader;
	});

	afterEach(() => {
		(global as Record<string, unknown>).FileReader = originalFileReader;
	});

	it('should reject files larger than 10 MB', async () => {
		const big = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.mah');
		await expect(importLayouts(big)).rejects.toThrow('File too large');
	});

	it('should parse a valid .mah JSON file', async () => {
		const payload = JSON.stringify({
			mah: '1.0',
			boards: [{ id: 'abc', name: 'Test', map: [] }]
		});
		fakeReaderContent = payload;
		const file = makeFile(payload, 'boards.mah');
		const result = await importLayouts(file);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Test');
	});

	it('should reject invalid JSON for .mah file', async () => {
		const content = 'not json{{';
		fakeReaderContent = content;
		const file = makeFile(content, 'boards.mah');
		await expect(importLayouts(file)).rejects.toThrow('Invalid JSON file');
	});

	it('should reject valid JSON that is not a mah format', async () => {
		const content = JSON.stringify({ not: 'mah' });
		fakeReaderContent = content;
		const file = makeFile(content, 'boards.mah');
		await expect(importLayouts(file)).rejects.toThrow('Invalid .mah file format');
	});

	it('should parse a .layout (kmahjongg v1.1) file', async () => {
		const data = [
			'kmahjongg-layout-v1.1',
			'# name: Dragon',
			'# by: Author',
			'w5',
			'h2',
			'd1',
			'10',
			'01'
		].join('\n');
		fakeReaderContent = data;
		const file = makeFile(data, 'dragon.layout');
		const result = await importLayouts(file);
		expect(result).toHaveLength(1);
	});

	it('should parse a .lay (Kyodai 6.0) file', async () => {
		const board = '0'.repeat(3400);
		const data = `Kyodai 6.0\nDragon\n${board}\n`;
		fakeReaderContent = data;
		const file = makeFile(data, 'dragon.lay');
		const result = await importLayouts(file);
		expect(result).toHaveLength(1);
	});

	it('should reject an unknown .layout format', async () => {
		const content = 'unknown-v99\n';
		fakeReaderContent = content;
		const file = makeFile(content, 'test.layout');
		await expect(importLayouts(file)).rejects.toThrow('Unknown .layout format');
	});
});
