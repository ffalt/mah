import { TILES } from '../consts';
import { SCORE_BASE_POINTS } from './score';

export const CHALLENGE_CODES = {
	CHALLENGE_MIDAS_MATCH: 1,
	CHALLENGE_SPARKSTONE: 2,
	CHALLENGE_THIRTY_IN_THREE: 3,
	CHALLENGE_FORTUNE_HUNT: 4,
	CHALLENGE_RUNNING_SAND: 5,
	CHALLENGE_THE_PURGE: 6,
	CHALLENGE_BLACKOUT: 7
} as const;

export type CHALLENGE_ID = (typeof CHALLENGE_CODES)[keyof typeof CHALLENGE_CODES];

export const CHALLENGE_IDS: Array<CHALLENGE_ID> = Object.values(CHALLENGE_CODES);

const CHALLENGE_NAMES = new Map<CHALLENGE_ID, string>(
	Object.entries(CHALLENGE_CODES).map(([name, id]) => [id, name])
);

export function challengeName(id: CHALLENGE_ID): string {
	return CHALLENGE_NAMES.get(id) ?? '';
}

export function challengeFromCode(code: number): CHALLENGE_ID | undefined {
	return CHALLENGE_IDS.find(id => id === code);
}

export const MARK_CODES = {
	midas: 1,
	spark: 2,
	target: 3
} as const;

export type StoneMark = keyof typeof MARK_CODES;

export const MARK_LABELS: Record<StoneMark, string> = {
	midas: 'MARK_MIDAS',
	spark: 'MARK_SPARK',
	target: 'MARK_TARGET'
};

export function markCode(mark: StoneMark): number {
	return MARK_CODES[mark];
}

export function markFromCode(code: number): StoneMark | undefined {
	return (Object.keys(MARK_CODES) as Array<StoneMark>).find(mark => MARK_CODES[mark] === code);
}

export type ChallengeVerdict = 'run' | 'won' | 'lost';

export type ChallengeObjective = 'clear' | 'midas' | 'matches' | 'score' | 'suit';

export interface ChallengeInfo {
	id: CHALLENGE_ID;
	objective: ChallengeObjective;
	timeLimit?: number;
	timeLimitPerTile?: number;
	timeBonus?: number;
	matchTarget?: number;
	scoreTarget?: number;
	allowHint: boolean;
	allowUndo: boolean;
}

export interface AnnouncedTime {
	min: number;
	max: number;
}

export type ChallengeMarkPlace = [number, number, number, number];

export interface ChallengeStateStore {
	code: number;
	seed: string;
	dayKey?: string;
	score?: number;
	matches?: number;
	combo?: number;
	lastMatchAt?: number;
	timeBonus?: number;
	marks?: Array<ChallengeMarkPlace>;
	suit?: number;
	undoPoints?: Array<number>;
	draws?: number;
}

export const CHALLENGE_SPARKSTONE_BONUS = 20_000;
export const CHALLENGE_SPARKSTONE_TIME_PER_TILE = 2500;
export const CHALLENGE_SPARKSTONE_SCORE_BONUS = 250;
export const CHALLENGE_RUNNING_SAND_START = 45_000;
export const CHALLENGE_RUNNING_SAND_BONUS = 5000;
export const CHALLENGE_RUNNING_SAND_COMBO_BONUS = 1000;
export const CHALLENGE_RUNNING_SAND_MAX_RESERVE = 60_000;
export const CHALLENGE_MIDAS_CLEAR_BONUS = 20;
export const CHALLENGE_PURGE_TIME_PER_BOARD_TILE = 2200;
export const CHALLENGE_PURGE_TIME_PER_TARGET = 4000;

export const Challenges: Array<ChallengeInfo> = [
	{
		id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH,
		objective: 'midas',
		allowHint: true,
		allowUndo: true
	},
	{
		id: CHALLENGE_CODES.CHALLENGE_SPARKSTONE,
		objective: 'clear',
		timeLimitPerTile: CHALLENGE_SPARKSTONE_TIME_PER_TILE,
		timeBonus: CHALLENGE_SPARKSTONE_BONUS,
		allowHint: true,
		allowUndo: false
	},
	{
		id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE,
		objective: 'matches',
		timeLimit: 180_000,
		matchTarget: 30,
		allowHint: true,
		allowUndo: false
	},
	{
		id: CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT,
		objective: 'score',
		timeLimit: 240_000,
		scoreTarget: 5000,
		allowHint: true,
		allowUndo: false
	},
	{
		id: CHALLENGE_CODES.CHALLENGE_RUNNING_SAND,
		objective: 'clear',
		timeLimit: CHALLENGE_RUNNING_SAND_START,
		timeBonus: CHALLENGE_RUNNING_SAND_BONUS,
		allowHint: true,
		allowUndo: false
	},
	{
		id: CHALLENGE_CODES.CHALLENGE_THE_PURGE,
		objective: 'suit',
		timeLimitPerTile: CHALLENGE_PURGE_TIME_PER_BOARD_TILE,
		allowHint: true,
		allowUndo: false
	},
	{
		id: CHALLENGE_CODES.CHALLENGE_BLACKOUT,
		objective: 'clear',
		allowHint: true,
		allowUndo: false
	}
];

export function challengeInfo(id: CHALLENGE_ID): ChallengeInfo {
	return Challenges.find(challenge => challenge.id === id) ?? Challenges[0];
}

export function baseTimeLimit(info: ChallengeInfo, tileCount: number): number | undefined {
	return info.timeLimitPerTile === undefined ? info.timeLimit : info.timeLimitPerTile * tileCount;
}

// the purge draws its suit at start and pays time per target tile, so it can only be announced as a span
export function announcedTimeLimit(info: ChallengeInfo, tileCount: number): AnnouncedTime | undefined {
	const base = baseTimeLimit(info, tileCount);
	if (base === undefined) {
		return undefined;
	}
	if (info.objective !== 'suit') {
		return { min: base, max: base };
	}
	const targets = suitTargetBounds(tileCount);
	return {
		min: base + (targets.min * CHALLENGE_PURGE_TIME_PER_TARGET),
		max: base + (targets.max * CHALLENGE_PURGE_TIME_PER_TARGET)
	};
}

export const CHALLENGE_MATCH_TILE_HEADROOM = 1.5;
export const CHALLENGE_MIN_TILE_COUNT = 72;
export const CHALLENGE_MAX_TILE_COUNT = 144;

export function minimumTileCount(info: ChallengeInfo): number {
	if (info.matchTarget !== undefined) {
		return Math.max(CHALLENGE_MIN_TILE_COUNT, Math.ceil(info.matchTarget * 2 * CHALLENGE_MATCH_TILE_HEADROOM));
	}
	if (info.scoreTarget === undefined) {
		return CHALLENGE_MIN_TILE_COUNT;
	}
	return Math.max(CHALLENGE_MIN_TILE_COUNT, 2 * Math.ceil(info.scoreTarget / SCORE_BASE_POINTS));
}

export const SUIT_GROUPS: Array<{ code: number; name: string; prefixes: Array<string> }> = [
	{ code: 1, name: 'TILES_SUIT_CIRCLES', prefixes: ['t_do'] },
	{ code: 2, name: 'TILES_SUIT_BAMBOO', prefixes: ['t_ba'] },
	{ code: 3, name: 'TILES_SUIT_CHARACTERS', prefixes: ['t_ch'] },
	{ code: 4, name: 'TILES_HONORS', prefixes: ['t_wi_', 't_dr_'] },
	{ code: 5, name: 'TILES_BONUS', prefixes: ['t_se_', 't_fl_'] }
];

export function suitGroupCode(name: string): number | undefined {
	return SUIT_GROUPS.find(group => group.name === name)?.code;
}

export function suitGroupName(code: number): string | undefined {
	return SUIT_GROUPS.find(group => group.code === code)?.name;
}

// every group is on a full board, a smaller one cannot hold more of a suit than it has places
export function suitTargetBounds(tileCount: number): { min: number; max: number } {
	const all = TILES.flat();
	const counts = SUIT_GROUPS
		.map(group => all.filter(id => group.prefixes.some(prefix => id.startsWith(prefix))).length)
		.filter(count => count > 0)
		.map(count => Math.min(count, tileCount));
	return { min: Math.min(...counts), max: Math.max(...counts) };
}
