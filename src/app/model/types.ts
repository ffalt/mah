import type { GAME_MODE_ID } from './consts';

export type SafeUrlSVG = string;

// [x, [x, amount (with 2 steps each) ]]
export type CompactMappingX = number | Array<number | Array<number>>;
export type CompactMappingY = [number, CompactMappingX];
export type CompactMappingZ = [number, Array<CompactMappingY>];
export type CompactMapping = Array<CompactMappingZ>;

// [z, x, y]
export type Place = [number, number, number];
export type Mapping = Array<Place>;

// [z, x, y, value]
export type StonePlace = [number, number, number, number];
export type StoneMapping = Array<StonePlace>;

export interface Layout {
	id: string;
	name: string;
	by?: string;
	category: string;
	mapping: Mapping;
	previewSVG?: SafeUrlSVG;
	custom?: boolean;
}

export interface LoadLayout {
	id: string;
	name: string;
	cat?: string;
	by?: string;
	map: CompactMapping;
}

export interface MahFormat {
	mah: '1.0';
	boards: Array<LoadLayout>;
}

export interface ImportLayout {
	name: string;
	by?: string;
	cat: string;
	mapping: Mapping;
}

export interface Layouts {
	items: Array<Layout>;
}

export interface LayoutScoreStore {
	playCount?: number;
	bestTime?: number;
}

export interface StorageProvider {
	getScore(id: string): LayoutScoreStore | undefined;

	getSettings(): SettingsStore | undefined;

	getState(): GameStateStore | undefined;

	storeScore(id: string, store?: LayoutScoreStore): void;

	storeSettings(store?: SettingsStore): void;

	storeState(store?: GameStateStore): void;
}

export class GameStateStore {
	elapsed?: number;
	state?: number;
	layout: string;
	gameMode: GAME_MODE_ID;
	undo?: Array<Place>;
	stones?: Array<StonePlace>;
}

export class SettingsStore {
	lang: string;
	sounds: boolean;
	music: boolean;
	contrast: boolean;
	dark: boolean;
	tileset: string;
	kyodaiUrl?: string;
	theme: string;
	background: string;
}
