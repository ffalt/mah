import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

export interface PatternEntry {
	id: string;
	title: string;
}

export function generatePatternList(): Array<{ id: string; title: string }> {
	const groups = {
		'adjointed': ['circles', 'diamonds'],
		'african': [[1, 5]],
		'batik': [[1, 7]],
		'blobs': [],
		'brick-wall': [[1, 2]],
		'candy-cane': [1],
		'chainlink': [[1, 3]],
		'checkerboard': [],
		'chevron': [1, 2, 3, 4, 5, 7, 8, 11, 13, 14, 15],
		'chinese': [[1, 14]],
		'christmas-bells': [1],
		'christmas-gift': [],
		'christmas-pattern': [[1, 7]],
		'christmas-tree': [1, 'balls'],
		'circles': [[1, 17], 19, 20, 22, 'and-diamonds'],
		'concentric-circles': [[1, 6]],
		'cross-section': [],
		'cubes': [[1, 6]],
		'diamonds': [[1, 15], 17, 18, 19, 20, 21],
		'doodle': [[1, 2]],
		'double-bubble': [[1, 4]],
		'egyptian': [1, 2, 3, 4, 6, 8, 9, 10, 12],
		'ethnic-pattern': [[1, 3]],
		'eyes': [[1, 4]],
		'flower': [[1, 7]],
		'geometric': [[1, 10]],
		'greek-key': [],
		'halloween': [[1, 7]],
		'hearts': [3, 5, 9],
		'herringbone': [[1, 8]],
		'hexagon': [[1, 11], 13],
		'interlocked-hexagons': [[1, 4]],
		'inverted-triangles': [],
		'japanese-pattern': [1, 2, 3, 4, 5, 6, 7, 8, 12],
		'jigsaw': [],
		'lanterns': [1],
		'leaves': [[1, 10]],
		'lines': [1, 2, 3, 4, 5, 6, 8],
		'memphis': [1, 2, 3, 4, 5, 6, 10],
		'mexican-pattern': [[1, 2]],
		'moroccan': [[1, 2]],
		'new': [[1, 17]],
		'octagons': [[1, 2]],
		'overlapping-hexagons': [],
		'patches': [],
		'pipes': [],
		'plaid-pattern': [[1, 6]],
		'plus': [[1, 6]],
		'quarter-circles': [[1, 2]],
		'railroad': [],
		'rectangles-and-squares': [1],
		'rope': [1],
		'santa-claus': [],
		'scales': [[1, 9]],
		'semicircles': [1],
		'snowflakes': [1],
		'songket': [1],
		'sprinkles': [1],
		'squares': [[1, 9]],
		'squares-and-plus': [1, 2],
		'squares-and-squares': [1, 2],
		'squares-and-triangles': [1, 2],
		'squares-and-stars': [1, 2],
		'squares-and-diamonds': [],
		'squares-and-diamonds-2': [],
		'squares-and-circles': [[1, 3]],
		'squiggle': [1],
		'stained-glass': [],
		'stars': [[1, 8]],
		'stars-and-lines': [1, 2],
		'straight-lines': [],
		'stripes': [[1, 2]],
		'terrazzo': [1],
		'tiles': [[1, 3]],
		'triangles': [[1, 25], 27, 28],
		'tribal': [[1, 5]],
		'waves': [[1, 20], 22, 24],
		'zebra': []
	};
	const result: Array<{ id: string }> = [];
	for (const [prefix, suffixes] of Object.entries(groups)) {
		if (suffixes.length === 0) {
			result.push({ id: prefix });
		}
		for (const suffix of suffixes) {
			if (Array.isArray(suffix)) {
				const [start, end] = suffix;
				for (let index = start; index <= end; index++) {
					result.push({ id: `${prefix}-${index}` });
				}
			} else {
				result.push({ id: `${prefix}-${suffix}` });
			}
		}
	}
	return result.map(p => ({
		id: p.id,
		title: p.id.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')
	}));
}

function encodeCSSSVG(svg: string): string {
	// Minify whitespace to keep data URI small
	const minified = svg
		.replace(/\s+/g, ' ') // collapse whitespace
		.replace(/>\s+</g, '><') // remove spaces between tags
		.trim();
	// URL-encode the SVG so it can be safely embedded in a CSS url("data:image/svg+xml;utf8,...")
	// encodeURIComponent covers special characters like #, %, <, >, & and quotes
	return encodeURIComponent(minified);
}

// https://github.com/catchspider2002/svelte-svg-patterns/blob/803e30bfde106cf094581aabfc80ced2062c5ab7/src/routes/%5Bslug%5D.svelte#L75
// MIT License
// Copyright (c) 2020 - 2023 pattern.monster
// https://pattern.monster/
function svgPattern(
	paths: Array<string>,
	width: number,
	height: number,
	vHeight: number,
	maxColors: number,
	mode: string,
	colors: Array<string>,
	colorCounts: number,
	stroke: number,
	scale: number,
	spacing: Array<number>,
	angle: number,
	join: number,
	moveLeft: number,
	moveTop: number
) {
	let joinMode = '';
	if (mode === 'stroke-join') {
		joinMode = join == 2 ? 'stroke-linejoin=\'round\' stroke-linecap=\'round\' ' : 'stroke-linecap=\'square\' ';
	}

	function multiStroke(index: number) {
		let color = colors[index + 1];
		if ((vHeight === 0) && (maxColors > 2) && (
			((colorCounts === 3) && (maxColors === 4) && (index === 2)) ||
			((colorCounts === 4) && (maxColors === 5) && (index === 3)) ||
			((colorCounts === 3) && (maxColors === 5) && (index === 3)) ||
			((colorCounts === 3) && (maxColors === 5) && (index === 2)) ||
			(colorCounts === 2)
		)) {
			color = colors[1];
		}
		let strokeFill: string;
		if (mode === 'stroke-join') {
			strokeFill = ` stroke='${color}' fill='none'`;
		} else if (mode === 'stroke') {
			strokeFill = ` stroke='${color}' fill='none'`;
		} else {
			strokeFill = ` stroke='none' fill='${color}'`;
		}
		const transform = spacing[0] / 2 === 0 ? '' : ` transform='translate(${spacing[0] / 2},${vHeight})'`;
		return `<path d='${paths[index]}' stroke-width='${stroke}'${strokeFill} ${transform}${joinMode}/>`;
	}

	const elements = [];
	const runs = Math.min(paths.length, ((vHeight === 0) && (maxColors > 2)) ? maxColors - 1 : colorCounts);
	for (let index = 0; index < runs; index++) {
		elements.push(multiStroke(index));
	}
	return [
		`<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>`,
		`<defs>`,
		`<pattern id='a' patternUnits='userSpaceOnUse' width='${
			width + spacing[0]}' height='${height - (vHeight * (maxColors - colorCounts)) + spacing[1]
		}' patternTransform='scale(${scale}) rotate(${angle})'>`,
		...elements,
		`</pattern></defs>`,
		`<rect width='800%' height='800%' transform='translate(${scale * moveLeft},${scale * moveTop})' fill='url(#a)'/>`,
		`</svg>`
	].join('');
}

@Injectable({
	providedIn: 'root'
})
export class PatternService {
	private readonly http = inject(HttpClient);
	private readonly cache: Record<string, CacheItem> = {};

	async get(name: string): Promise<string> {
		let item = this.cache[name];
		if (item) {
			if (item.data) {
				return item.data;
			}
			if (item.request !== undefined) {
				return item.request;
			}
		}
		item = {};
		const request = new Promise<string>((resolve, reject) => {
			setTimeout(() => {
				this.http.get(`assets/patterns/${name}.json`, { responseType: 'text' })
					.subscribe({
						next: result => {
							item.data = result;
							item.request = undefined;
							resolve(result);
						},
						error: (error: unknown) => {
							reject(error as Error);
						}
					});
			});
		});
		item.request = request;
		this.cache[name] = item;
		return request;
	}

	async svgDataUrl(name: string, colors: Array<string>): Promise<string> {
		const json = await this.get(name);
		return `url("data:image/svg+xml;utf8,${this.svgBackground(json, colors)}")`;
	}

	svgBackground(json: string, colors: Array<string>): string {
		const pattern = JSON.parse(json);

		const svg = svgPattern(pattern.path, pattern.width, pattern.height, pattern.vHeight ?? 0, pattern.path.length + 1,
			pattern.mode, ['', ...colors], colors.length + 1, 1, 1, pattern.spacing ?? [0, 0], 0, 1, 0, 0);
		return encodeCSSSVG(svg);
	}
}
