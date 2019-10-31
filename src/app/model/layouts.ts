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

	/*
	public sortMapping(mapping: Mapping) {
		mapping.sort((a: Place, b: Place): number => {
			if (a[0] < b[0]) {
				return -1;
			}
			if (a[0] > b[0]) {
				return 1;
			}
			if (a[2] < b[2]) {
				return -1;
			}
			if (a[2] > b[2]) {
				return 1;
			}
			if (a[1] < b[1]) {
				return -1;
			}
			if (a[1] > b[1]) {
				return 1;
			}
			return 0;
		});
	}

	public compactMapping(mapping: Mapping): Mapping {
		const maplist: Mapping = [];
		mapping.forEach((o) => {
			const place: Array<number> = [];
			for (let i = 0; i < 4; i++) {
				place.push(o[i]);
			}
			maplist.push(place);
		});
		this.sortMapping(maplist);
		const result: Mapping = [];
		for (let i = maplist.length - 1; i >= 1; i--) {
			const item = maplist[i];
			const before = maplist[i - 1];
			if ((item[0] === before[0]) && (item[2] === before[2]) && (item[1] - 2 === before[1])) {
				before[3] = (before[3] || 1) + (item[3] || 1);
			} else if ((item[3] || 1) === 1) {
				result.unshift([item[0], item[1], item[2]]);
			} else {
				result.unshift(item);
			}
		}
		const first = maplist[0];
		result.unshift([first[0], first[1], first[2]]);
		return result;
	}
	*/

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
