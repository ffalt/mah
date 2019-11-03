import {LoadLayout} from '../service/layout.service';

// [z, x, y, nr-of-items-in-x-direction or 1-if-undefined]
export interface Place extends Array<number> {
}

export interface Mapping extends Array<Place> {
}

export class Layout {
	name: string;
	category: string;
	mapping: Mapping;
	previewSVG?: any;
}

export class Layouts {
	items: Array<Layout> = [];

	static expandMapping(mapping: Mapping): Mapping {
		const result: Mapping = [];
		if (mapping) {
			mapping.forEach(m => {
				for (let i = 0; i < (m[3] || 1); i++) {
					result.push([m[0], m[1] + (i * 2), m[2]]);
				}
			});
		}
		return result;
	}

	load(list: Array<LoadLayout>): void {
		this.items = list.map((o, i) => {
			const mapping = Layouts.expandMapping(o.mapping);
			return {
				name: o.name,
				category: o.cat || 'Classic',
				mapping
			};
		});
	}

}
