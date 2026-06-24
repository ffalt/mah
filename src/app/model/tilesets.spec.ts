import { isKyodaiImageSet, buildTiles, buildKyodaiSVG, KyodaiTileSets } from './tilesets';

type EventHandler = (event?: Event) => void;

class FakeImageSuccess {
	private readonly handlers = new Map<string, EventHandler>();

	readonly width = 675;

	readonly height = 500;

	set src(_url: string) {
		setTimeout(() => {
			this.handlers.get('load')?.();
		}, 0);
	}

	addEventListener(event: string, handler: EventHandler): void {
		this.handlers.set(event, handler);
	}
}

class FakeImageError {
	private readonly handlers = new Map<string, EventHandler>();

	set src(_url: string) {
		setTimeout(() => {
			this.handlers.get('error')?.(new Event('error'));
		}, 0);
	}

	addEventListener(event: string, handler: EventHandler): void {
		this.handlers.set(event, handler);
	}
}

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('isKyodaiImageSet', () => {
	it('returns true for kyodai', () => {
		expect(isKyodaiImageSet('kyodai')).toBe(true);
	});

	it('returns true for kyodai-black', () => {
		expect(isKyodaiImageSet('kyodai-black')).toBe(true);
	});

	it('returns false for other names', () => {
		expect(isKyodaiImageSet('default')).toBe(false);
		expect(isKyodaiImageSet('')).toBe(false);
		expect(isKyodaiImageSet('kyodai-other')).toBe(false);
	});
});

describe('KyodaiTileSets', () => {
	it('is a non-empty array', () => {
		expect(KyodaiTileSets.length).toBeGreaterThan(0);
	});

	it('every entry has a source', () => {
		for (const ts of KyodaiTileSets) {
			expect(typeof ts.source).toBe('string');
			expect(ts.source.length).toBeGreaterThan(0);
		}
	});
});

describe('buildTiles', () => {
	it('returns empty string for empty tiles array', () => {
		expect(buildTiles([], 42, 100, 75)).toBe('');
	});

	it('generates one svg per tile id', () => {
		const tiles = [['t_do1', 't_do2'], ['t_ba1', 't_ba2']];
		const result = buildTiles(tiles, 99, 100, 75);
		expect(result.match(/<svg /g)?.length).toBe(4);
	});

	it('places tiles at correct x/y offsets', () => {
		const tiles = [['t_do1'], ['t_do2']];
		const result = buildTiles(tiles, 1, 100, 75);
		expect(result).toContain('viewBox="0 0 75 100"');
		expect(result).toContain('viewBox="0 100 75 100"');
	});

	it('sets the correct id and image reference', () => {
		const tiles = [['t_do1']];
		const result = buildTiles(tiles, 7, 100, 75);
		expect(result).toContain('id="t_do1"');
		expect(result).toContain('href="#7"');
	});
});

describe('buildKyodaiSVG', () => {
	it('returns empty svg when no url provided', async () => {
		const result = await buildKyodaiSVG();
		expect(result).toBe('<svg><defs></defs></svg>');
	});

	it('returns empty svg for empty string url', async () => {
		const result = await buildKyodaiSVG('');
		expect(result).toBe('<svg><defs></defs></svg>');
	});

	it('resolves with svg markup when image loads', async () => {
		const fakeUrl = 'https://example.com/tiles.jpg';
		(globalThis as Record<string, unknown>).Image = FakeImageSuccess;

		const result = await buildKyodaiSVG(fakeUrl);
		expect(result).toContain('<svg>');
		expect(result).toContain('<defs>');
		expect(result).toContain(fakeUrl);
		expect(result).toContain('</svg>');
	});

	it('rejects when image fails to load', async () => {
		const fakeUrl = 'https://example.com/bad.jpg';
		(globalThis as Record<string, unknown>).Image = FakeImageError;

		await expect(buildKyodaiSVG(fakeUrl)).rejects.toThrow(`Image ${fakeUrl} could not be loaded.`);
	});
});
