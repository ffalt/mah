// [x, [x, amount (with 2 steps each) ]]
import {GAME_MODE_ID} from './consts';

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
export type Place = [number, number, number];

export interface Mapping extends Array<Place> {
}

// [z, x, y, value]
export type StonePlace = [number, number, number, number];

export interface StoneMapping extends Array<StonePlace> {
}

export interface Layout {
	id: string;
	name: string;
	by?: string;
	category: string;
	mapping: Mapping;
	previewSVG?: any;
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
	contrast: boolean;
	tileset: string;
	theme: string;
	background: string;
}
