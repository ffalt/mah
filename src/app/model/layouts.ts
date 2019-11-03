// [z, x, y]
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

export interface Layouts {
	items: Array<Layout>;
}
