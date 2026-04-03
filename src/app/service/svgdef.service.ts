import { HttpClient } from '@angular/common/http';
import { buildKyodaiSVG, imageSetIsKyodai } from '../model/tilesets';
import { Injectable, inject } from '@angular/core';
import { HttpCache } from './http-cache';

@Injectable({
	providedIn: 'root'
})
export class SvgdefService {
	private readonly cache = new HttpCache(inject(HttpClient));

	async get(name: string, kyodaiUrl?: string): Promise<string> {
		if (imageSetIsKyodai(name)) {
			return buildKyodaiSVG(kyodaiUrl);
		}
		return this.cache.get(`assets/svg/${name}.svg`);
	}
}
