import type { GAME_MODE_ID } from './consts';
import type { BUILD_MODE_ID } from './builder';
import type { ChallengeStateStore } from './challenge/consts';

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
	loseCount?: number;
	winCount?: number;
	bestTime?: number;
	playTime?: number;
}

export interface DailyResultStore {
	// a CHALLENGE_ID, but kept as number - a newer build may have stored a code this one does not know
	challenge: number;
	won: boolean;
	playTime?: number;
	score?: number;
	attempts: number;
	firstTry: boolean;
}

export interface DailyMonthStore {
	v: number;
	days: Record<string, DailyResultStore>;
}

export interface DailyBestStore {
	challenge: number;
	score: number;
	dayKey: string;
	won: boolean;
}

// a month that is over can never change, so its totals are folded in here once and never read again
export interface DailyRollupStore {
	v: number;
	through: string;
	played: number;
	won: number;
	bests: Array<DailyBestStore>;
}

export interface DailyMetaStore {
	v: number;
	streak: number;
	best: number;
	last?: string;
	played: number;
	won: number;
	rollup?: DailyRollupStore;
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
	buildMode?: BUILD_MODE_ID;
	undo?: Array<Place>;
	stones?: Array<StonePlace>;
	challenge?: ChallengeStateStore;
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
	pattern?: string;
	tile3d?: boolean;
	shadows?: boolean;
	animations?: boolean;
	confetti?: boolean;
	showClock?: boolean;
	tutorialCompleted?: boolean;
}
