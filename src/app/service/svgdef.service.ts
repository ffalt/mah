import { HttpClient } from '@angular/common/http';
import { buildKyodaiSVG, isKyodaiImageSet } from '../model/tilesets';
import { inject, Service } from '@angular/core';
import { HttpCache } from './http-cache';

@Service()
export class SvgdefService {
	private readonly cache = new HttpCache(inject(HttpClient));

	async get(name: string, kyodaiUrl?: string): Promise<string> {
		if (isKyodaiImageSet(name)) {
			return buildKyodaiSVG(kyodaiUrl);
		}
		return this.cache.get(`assets/svg/${name}.svg`);
	}
}
