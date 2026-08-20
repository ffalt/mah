import { stringToSeed } from '../rng';
import { CHALLENGE_IDS, type CHALLENGE_ID } from './consts';

export const DAILY_LAYOUT_ID_PREFIX = 'daily-';
const GENERATED_WEEKDAY = 0;

function pad(value: number): string {
	return value < 10 ? `0${value}` : value.toString();
}

export function dailyKey(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dailyMonthKey(dayKey: string): string {
	return dayKey.slice(0, 7);
}

export function dailySeed(dayKey: string): string {
	return `daily-${dayKey}`;
}

export function parseDailyKey(dayKey: string): Date | undefined {
	const parts = dayKey.split('-').map(Number);
	if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
		return undefined;
	}
	return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function isGeneratedLayoutDay(date: Date): boolean {
	return date.getDay() === GENERATED_WEEKDAY;
}

export function dailyLayoutId(dayKey: string): string {
	return `${DAILY_LAYOUT_ID_PREFIX}${dayKey}`;
}

// highest weight wins: keying off each candidate's own identity rather than its position means adding
// or removing one only moves the days that candidate itself claims, instead of reshuffling every day
export function pickDailyItem<T>(dayKey: string, salt: string, items: ReadonlyArray<T>, identity: (item: T) => string): T | undefined {
	let best: T | undefined;
	let bestId = '';
	let bestWeight = 0;
	for (const item of items) {
		const id = identity(item);
		const weight = stringToSeed(`${dailySeed(dayKey)}-${salt}-${id}`);
		if (best === undefined || weight > bestWeight || (weight === bestWeight && id < bestId)) {
			best = item;
			bestId = id;
			bestWeight = weight;
		}
	}
	return best;
}

export function pickDailyChallenge(dayKey: string, available: Array<CHALLENGE_ID> = CHALLENGE_IDS): CHALLENGE_ID {
	return pickDailyItem(dayKey, 'challenge', available, String) ?? CHALLENGE_IDS[0];
}
