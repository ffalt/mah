import { isKyodaiImageSet, buildTiles, buildKyodaiSVG, KyodaiTileSets, tileImageCut, tileImagePos } from './tilesets';
import { describe, beforeEach, it, expect, vi } from 'vitest';

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

	it('returns false when no name is given', () => {
		expect(isKyodaiImageSet()).toBe(false);
		expect(isKyodaiImageSet(undefined)).toBe(false);
	});
});

describe('tile geometry', () => {
	it.each([undefined, '', 'classic', 'riichi', 'uni'])('insets the art for the svg tileset %s', imageSet => {
		expect(tileImagePos(imageSet)).toEqual([6, 6, 63, 88]);
		expect(tileImageCut(imageSet)).toEqual([0, 0, 65, 90]);
	});

	it.each(['kyodai', 'kyodai-black'])('fills the whole face for %s', imageSet => {
		expect(tileImagePos(imageSet)).toEqual([0, 0, 75, 100]);
		expect(tileImageCut(imageSet)).toEqual([1, 1, 73, 98]);
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
	it('rejects when no url provided', async () => {
		await expect(buildKyodaiSVG()).rejects.toThrow('Kyodai tileset has no image url.');
	});

	it('rejects for empty string url', async () => {
		await expect(buildKyodaiSVG('')).rejects.toThrow('Kyodai tileset has no image url.');
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

	it('escapes the url so it cannot break out of the attribute', async () => {
		const payload = 'https://example.com/tiles.jpg#"><foreignObject><img src=x onerror=alert(1)>';
		(globalThis as Record<string, unknown>).Image = FakeImageSuccess;

		const result = await buildKyodaiSVG(payload);
		expect(result).not.toContain('<foreignObject>');

		const host = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		host.innerHTML = result;
		expect(host.querySelector('foreignObject')).toBeNull();
		expect(host.querySelector('img')).toBeNull();
		// the payload stays inside the attribute value instead of becoming markup
		expect(host.querySelector('image')?.getAttribute('xlink:href')).toBe(payload);
	});

	it('keeps a url with query parameters intact after parsing', async () => {
		const url = 'https://example.com/tiles.jpg?a=1&b=2';
		(globalThis as Record<string, unknown>).Image = FakeImageSuccess;

		const result = await buildKyodaiSVG(url);
		const host = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		host.innerHTML = result;
		expect(host.querySelector('image')?.getAttribute('xlink:href')).toBe(url);
	});

	it('rejects when image fails to load', async () => {
		const fakeUrl = 'https://example.com/bad.jpg';
		(globalThis as Record<string, unknown>).Image = FakeImageError;

		await expect(buildKyodaiSVG(fakeUrl)).rejects.toThrow(`Image ${fakeUrl} could not be loaded.`);
	});
});
