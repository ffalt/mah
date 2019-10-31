export interface Place extends Array<number> {
	dummy?: boolean;
}

export interface Mapping extends Array<Place> {
	dummy?: boolean;
}

export class Layout {
	index: number;
	name: string;
	mapping: Mapping;
	previewSVG?: any;
}

export class Layouts {
	items: Array<Layout> = [];

	load(list: Array<{ name: string; mapping: Mapping }>): void {
		this.items = list.map((o, i) => {
			const mapping = this.expandMapping(o.mapping);
			return {
				index: i,
				name: o.name,
				mapping
			};
		});
	}

	expandMapping(mapping: Mapping): Mapping {
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

}
