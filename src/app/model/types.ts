
// [x, [x, amount (with 2 steps each) ]]
export interface CompactMappingX extends Array<number | Array<number>> {
}

// [y, [SuperCompactMappingX]]
export interface CompactMappingY extends Array<number | CompactMappingX> {
}

// [z, [SuperCompactMappingY]]
export interface CompactMappingZ extends Array<number | Array<CompactMappingY>> {
}

// [SuperCompactMappingZ]
export interface CompactMapping extends Array<CompactMappingZ> {
}

// [z, x, y]
export interface Place extends Array<number> {
}

export interface Mapping extends Array<Place> {
}

export interface Layout {
	id: string;
	name: string;
	category: string;
	mapping: Mapping;
	previewSVG?: any;
}

export interface Layouts {
	items: Array<Layout>;
}

export interface LayoutBestTime {
	playCount?: number;
	bestTime?: number;
}

export interface LoadLayout {
	name: string;
	id?: string;
	cat?: string;
	mapping?: Mapping;
	map?: CompactMapping;
}

export interface ImportLayout {
	name: string;
	by?: string;
	cat: string;
	mapping: Mapping;
}

export interface StorageProvider {
	get<T>(name: string): T | undefined;

	set<T>(key: string, data: T): void;
}

export class GameStateStore {
	elapsed?: number;
	state?: number;
	layout: string;
	undo?: Array<Array<number>>;
	stones?: Array<Array<number>>;
}
