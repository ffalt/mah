import { HttpClient } from '@angular/common/http';
import { buildKyodaiSVG, isKyodaiImageSet } from '../model/tilesets';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpCache } from './http-cache';

// Injectable seam for the Kyodai tileset helpers so tests can supply stubs via DI
// instead of mocking the module.
export const KYODAI_TILES = new InjectionToken<{ isKyodaiImageSet: typeof isKyodaiImageSet; buildKyodaiSVG: typeof buildKyodaiSVG }>('KYODAI_TILES', {
	providedIn: 'root',
	factory: () => ({ isKyodaiImageSet, buildKyodaiSVG })
});

@Injectable({ providedIn: 'root' })
export class SvgdefService {
	private readonly cache = new HttpCache(inject(HttpClient));
	private readonly kyodai = inject(KYODAI_TILES);

	async get(name: string, kyodaiUrl?: string): Promise<string> {
		if (this.kyodai.isKyodaiImageSet(name)) {
			return this.kyodai.buildKyodaiSVG(kyodaiUrl);
		}
		return this.cache.get(`assets/svg/${name}.svg`);
	}
}
