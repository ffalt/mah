import { describe, it, expect } from 'vitest';
import {
	DAILY_LAYOUT_ID_PREFIX,
	dailyKey,
	dailyLayoutId,
	dailyMonthKey,
	dailySeed,
	isGeneratedLayoutDay,
	parseDailyKey,
	pickDailyChallenge,
	pickDailyItem
} from './daily';
import { CHALLENGE_CODES, type CHALLENGE_ID, CHALLENGE_IDS } from './consts';

describe('daily', () => {
	it('formats a local calendar date', () => {
		expect(dailyKey(new Date(2026, 6, 30))).toBe('2026-07-30');
		expect(dailyKey(new Date(2026, 0, 1))).toBe('2026-01-01');
	});

	it('derives the month key', () => {
		expect(dailyMonthKey('2026-07-30')).toBe('2026-07');
	});

	it('derives a stable seed', () => {
		expect(dailySeed('2026-07-30')).toBe('daily-2026-07-30');
	});

	it('round-trips a day key through a date', () => {
		const date = new Date(2026, 6, 30);
		const parsed = parseDailyKey(dailyKey(date));
		expect(parsed).toBeDefined();
		expect(dailyKey(parsed!)).toBe(dailyKey(date));
	});

	it('rejects a malformed day key', () => {
		expect(parseDailyKey('nope')).toBeUndefined();
		expect(parseDailyKey('2026-xx-01')).toBeUndefined();
	});

	it('prefixes the generated layout id', () => {
		expect(dailyLayoutId('2026-07-30').startsWith(DAILY_LAYOUT_ID_PREFIX)).toBe(true);
	});

	it('marks Sunday as the generated layout day', () => {
		// 2026-08-02 is a Sunday
		expect(isGeneratedLayoutDay(new Date(2026, 7, 2))).toBe(true);
		expect(isGeneratedLayoutDay(new Date(2026, 7, 3))).toBe(false);
	});

	it('picks the same challenge for the same day', () => {
		expect(pickDailyChallenge('2026-07-30')).toBe(pickDailyChallenge('2026-07-30'));
	});

	it('only ever picks a declared challenge', () => {
		for (let day = 1; day <= 28; day++) {
			const key = dailyKey(new Date(2026, 6, day));
			expect(CHALLENGE_IDS).toContain(pickDailyChallenge(key));
		}
	});

	it('honours a restricted challenge list', () => {
		const allowed: Array<CHALLENGE_ID> = [CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE];
		for (let day = 1; day <= 14; day++) {
			const key = dailyKey(new Date(2026, 6, day));
			expect(allowed).toContain(pickDailyChallenge(key, allowed));
		}
	});

	it('varies the challenge across a month', () => {
		const picked = new Set<CHALLENGE_ID>();
		for (let day = 1; day <= 28; day++) {
			picked.add(pickDailyChallenge(dailyKey(new Date(2026, 6, day))));
		}
		expect(picked.size).toBeGreaterThan(1);
	});

	it('picks the same item for the same day, and varies across days', () => {
		const boards = ['turtle', 'dragon', 'cactus', 'arena'];
		expect(pickDailyItem('2026-07-30', 'layout', boards, id => id))
			.toBe(pickDailyItem('2026-07-30', 'layout', boards, id => id));
		const picked = new Set<string | undefined>();
		for (let day = 1; day <= 28; day++) {
			picked.add(pickDailyItem(dailyKey(new Date(2026, 6, day)), 'layout', boards, id => id));
		}
		expect(picked.size).toBeGreaterThan(1);
	});

	it('ignores the order the candidates arrive in', () => {
		const boards = ['turtle', 'dragon', 'cactus', 'arena'];
		for (let day = 1; day <= 14; day++) {
			const key = dailyKey(new Date(2026, 6, day));
			expect(pickDailyItem(key, 'layout', [...boards].reverse(), id => id))
				.toBe(pickDailyItem(key, 'layout', boards, id => id));
		}
	});

	it('keeps every day that a removed candidate did not own', () => {
		const boards = ['turtle', 'dragon', 'cactus', 'arena'];
		const days = Array.from({ length: 60 }, (_value, index) => dailyKey(new Date(2026, 6, index + 1)));
		const before = days.map(key => pickDailyItem(key, 'layout', boards, id => id));
		// the whole point: dropping one board must not reshuffle the days the others already held
		const fewer = boards.filter(id => id !== 'dragon');
		const after = days.map(key => pickDailyItem(key, 'layout', fewer, id => id));

		// without days of its own the test would pass vacuously
		expect(before).toContain('dragon');
		const moved = before
			.map((day, index) => ({ day, was: day, now: after[index] }))
			.filter(entry => entry.was !== 'dragon' && entry.now !== entry.was);
		expect(moved).toEqual([]);
	});

	it('survives an empty candidate list', () => {
		expect(pickDailyItem('2026-07-30', 'layout', [], (id: string) => id)).toBeUndefined();
		// the challenge picker still has to name one
		expect(CHALLENGE_IDS).toContain(pickDailyChallenge('2026-07-30', []));
	});
});
