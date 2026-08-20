import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Mocked, describe, beforeEach, it, expect, vi } from 'vitest';
import { DailyService } from './daily.service';
import { LayoutService } from './layout.service';
import { LocalstorageService } from './localstorage.service';
import type { DailyMetaStore, DailyMonthStore, Layout, Layouts, Place } from '../model/types';
import { CHALLENGE_CODES, CHALLENGE_IDS, CHALLENGE_MAX_TILE_COUNT, CHALLENGE_MIN_TILE_COUNT, challengeInfo, minimumTileCount } from '../model/challenge/consts';
import { dailyKey } from '../model/challenge/daily';

// full-size by default, since a match target rules out boards too small to hold it
function layout(id: string, custom?: boolean, tiles = 144): Layout {
	return { id, name: id, category: 'Test', mapping: Array.from({ length: tiles }, (_value, index): Place => [0, index * 2, 0]), custom };
}

describe('DailyService', () => {
	let service: DailyService;
	let months: Map<string, DailyMonthStore>;
	let meta: DailyMetaStore | undefined;
	let mockStorage: Mocked<LocalstorageService>;
	let mockLayoutService: Mocked<LayoutService>;
	let items: Array<Layout>;

	beforeEach(() => {
		months = new Map<string, DailyMonthStore>();
		meta = undefined;
		items = [layout('a'), layout('b'), layout('c'), layout('d')];

		mockStorage = {
			getDailyMonth: vi.fn((key: string) => months.get(key)),
			storeDailyMonth: vi.fn((key: string, store?: DailyMonthStore) => {
				if (store) {
					months.set(key, store);
				} else {
					months.delete(key);
				}
			}),
			getDailyMonthKeys: vi.fn(() => Array.from(months.keys())),
			getDailyMeta: vi.fn(() => meta),
			storeDailyMeta: vi.fn((store?: DailyMetaStore) => {
				meta = store;
			})
		} as unknown as Mocked<LocalstorageService>;

		mockLayoutService = {
			get: vi.fn(async (): Promise<Layouts> => ({ items }))
		} as unknown as Mocked<LayoutService>;

		service = createService();
	});

	// a cold service against the same storage - what the next app start sees
	function createService(): DailyService {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				DailyService,
				{ provide: LocalstorageService, useValue: mockStorage },
				{ provide: LayoutService, useValue: mockLayoutService },
				{ provide: TranslateService, useValue: { instant: (key: string) => key } }
			]
		});
		return TestBed.inject(DailyService);
	}

	function session(date: Date): DailyService {
		const next = createService();
		vi.spyOn(next, 'now').mockReturnValue(date);
		return next;
	}

	describe('resolve', () => {
		it('resolves the same challenge and layout for the same day', async () => {
			// 2026-07-30 is a Thursday, so a built-in board
			const date = new Date(2026, 6, 30);
			const first = await service.resolve(date);
			const second = await service.resolve(date);
			expect(first.dayKey).toBe('2026-07-30');
			expect(first.seed).toBe('daily-2026-07-30');
			expect(second.challenge).toBe(first.challenge);
			expect(second.layout.id).toBe(first.layout.id);
			expect(first.generated).toBe(false);
		});

		it('resolves a different day to a different seed', async () => {
			const first = await service.resolve(new Date(2026, 6, 30));
			const second = await service.resolve(new Date(2026, 6, 31));
			expect(second.seed).not.toBe(first.seed);
		});

		it('generates a board on the generated weekday', async () => {
			// 2026-08-02 is a Sunday
			const entry = await service.resolve(new Date(2026, 7, 2));
			expect(entry.generated).toBe(true);
			expect(entry.layout.id).toBe('daily-2026-08-02');
			expect(entry.layout.mapping.length).toBe(144);
		});

		it('generates the identical board for the same generated day', async () => {
			const first = await service.resolve(new Date(2026, 7, 2));
			const second = await service.resolve(new Date(2026, 7, 2));
			expect(second.layout.mapping).toEqual(first.layout.mapping);
			// the very same object, so the board is generated once however often the dialog opens
			expect(second.layout).toBe(first.layout);
		});

		it('keeps the rendered preview of a generated board across dialog opens', async () => {
			const first = await service.resolve(new Date(2026, 7, 2));
			// LayoutService.getPreview caches the rendered svg onto the layout it is handed
			first.layout.previewSVG = 'rendered-once';

			const second = await service.resolve(new Date(2026, 7, 2));

			expect(second.layout.previewSVG).toBe('rendered-once');
		});

		it('generates the identical board for two players on the same day', async () => {
			// two fresh services stand in for two devices - the memo is per instance, so both really generate
			const playerA = await createService().resolve(new Date(2026, 7, 2));
			const playerB = await createService().resolve(new Date(2026, 7, 2));

			expect(playerB.layout).not.toBe(playerA.layout);
			expect(playerB.layout.mapping).toEqual(playerA.layout.mapping);
			expect(playerB.challenge).toBe(playerA.challenge);
			expect(playerB.seed).toBe(playerA.seed);
		});

		it('generates a separate board per generated day', async () => {
			const first = await service.resolve(new Date(2026, 7, 2));
			// 2026-08-09 is the next Sunday
			const second = await service.resolve(new Date(2026, 7, 9));

			expect(second.layout).not.toBe(first.layout);
			expect(second.layout.id).toBe('daily-2026-08-09');
			expect(second.layout.mapping).not.toEqual(first.layout.mapping);
		});

		it('relabels a cached generated board when the language changes', async () => {
			const first = await service.resolve(new Date(2026, 7, 2));
			expect(first.layout.name).toBe('DAILY_GENERATED_BOARD');
			vi.spyOn(TestBed.inject(TranslateService), 'instant').mockReturnValue('Zufallsbrett');

			const second = await service.resolve(new Date(2026, 7, 2));

			// the board survives, its name does not
			expect(second.layout).toBe(first.layout);
			expect(second.layout.name).toBe('Zufallsbrett');
		});

		it('never picks a custom board', async () => {
			items = [layout('custom-1', true), layout('built-in')];
			const picked: Array<string> = [];
			for (let day = 1; day <= 20; day++) {
				const entry = await service.resolve(new Date(2026, 6, day));
				if (!entry.generated) {
					picked.push(entry.layout.id);
				}
			}
			expect(picked.length).toBeGreaterThan(0);
			expect([...new Set(picked)]).toEqual(['built-in']);
		});

		// a match target on a board that barely holds it would demand near-total clearance against the clock
		it('never hands a match target a board too small for it', async () => {
			items = [layout('small', false, 80), layout('big')];
			const picks: Array<{ needsRoom: boolean; id: string }> = [];
			for (let day = 1; day <= 60; day++) {
				const entry = await service.resolve(new Date(2026, 6, day));
				if (!entry.generated) {
					picks.push({ needsRoom: minimumTileCount(challengeInfo(entry.challenge)) > CHALLENGE_MIN_TILE_COUNT, id: entry.layout.id });
				}
			}
			const targeted = picks.filter(pick => pick.needsRoom);
			expect(targeted.length).toBeGreaterThan(0);
			expect([...new Set(targeted.map(pick => pick.id))]).toEqual(['big']);
			// the small board clears the global floor, so it is only ruled out where a target needs more
			expect(picks.some(pick => !pick.needsRoom && pick.id === 'small')).toBe(true);
		});

		// above a full mahjong set the board fills up with jokers and extras, which no suit can claim
		it('drops a board over the tile-set ceiling from every challenge', async () => {
			items = [layout('huge', false, CHALLENGE_MAX_TILE_COUNT + 4), layout('big')];
			const picked: Array<string> = [];
			for (let day = 1; day <= 60; day++) {
				const entry = await service.resolve(new Date(2026, 6, day));
				if (!entry.generated) {
					picked.push(entry.layout.id);
				}
			}
			expect(picked.length).toBeGreaterThan(0);
			expect([...new Set(picked)]).toEqual(['big']);
		});

		it('keeps a board of exactly a full tile set', async () => {
			items = [layout('full', false, CHALLENGE_MAX_TILE_COUNT)];
			const entry = await service.resolve(new Date(2026, 6, 30));
			expect(entry.layout.id).toBe('full');
		});

		// below the global floor a daily is over before it starts, whatever the challenge asks for
		it('drops a board under the global floor from every challenge', async () => {
			items = [layout('tiny', false, CHALLENGE_MIN_TILE_COUNT - 2), layout('big')];
			const picked: Array<string> = [];
			for (let day = 1; day <= 60; day++) {
				const entry = await service.resolve(new Date(2026, 6, day));
				if (!entry.generated) {
					picked.push(entry.layout.id);
				}
			}
			expect(picked.length).toBeGreaterThan(0);
			expect([...new Set(picked)]).toEqual(['big']);
		});

		it('falls back to a generated board when no built-in board exists', async () => {
			items = [];
			const entry = await service.resolve(new Date(2026, 6, 30));
			expect(entry.layout.mapping.length).toBe(144);
		});

		it('reports an existing result for the day', async () => {
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 60_000, 1000);
			const entry = await service.resolve(new Date(2026, 6, 30));
			expect(entry.result?.won).toBe(true);
		});
	});

	describe('record', () => {
		it('stores a win', () => {
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 60_000, 1500);
			const result = service.getResult('2026-07-30');
			expect(result).toEqual({
				challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH,
				won: true,
				attempts: 1,
				firstTry: true,
				playTime: 60_000,
				score: 1500
			});
		});

		it('counts attempts and keeps a win once earned', () => {
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, false, 10_000, 200);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 50_000, 900);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, false, 5000, 100);
			const result = service.getResult('2026-07-30');
			expect(result?.attempts).toBe(3);
			expect(result?.won).toBe(true);
			// a win on the second try is not a first-try win
			expect(result?.firstTry).toBe(false);
		});

		it('keeps the fastest winning time and the highest score', () => {
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 90_000, 800);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 45_000, 500);
			const result = service.getResult('2026-07-30');
			expect(result?.playTime).toBe(45_000);
			expect(result?.score).toBe(800);
		});

		it('does not record a play time for a loss', () => {
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, false, 30_000, 300);
			expect(service.getResult('2026-07-30')?.playTime).toBeUndefined();
		});

		it('keeps separate records per month', () => {
			service.record('2026-07-31', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-08-01', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(months.has('2026-07')).toBe(true);
			expect(months.has('2026-08')).toBe(true);
		});

		it('reads no month again for a recorded run', () => {
			// record() refreshes against the real calendar day, so pin it or the count moves with the date
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 6, 30));
			for (const day of ['2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01']) {
				service.record(day, CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			}
			// the dialog opens and warms the caches, as it does before any run can start
			service.refresh();
			expect(months.size).toBe(4);
			mockStorage.getDailyMonth.mockClear();

			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);

			// the write updates the totals in place, so nothing has to be re-read to answer for it
			expect(mockStorage.getDailyMonth).not.toHaveBeenCalled();
			expect(service.played()).toBe(5);
			expect(service.getResult('2026-07-30')?.score).toBe(10);
		});

		it('sees a record written after the caches were warmed', () => {
			service.refresh(new Date(2026, 6, 30));
			expect(service.getResult('2026-07-30')).toBeUndefined();
			expect(service.bestScore(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT)).toBe(0);

			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, true, 1000, 4200);

			expect(service.getResult('2026-07-30')?.score).toBe(4200);
			expect(service.bestScore(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT)).toBe(4200);
			expect(service.played()).toBe(1);
		});

		it('reports a new best against the score banked before this run', () => {
			service.record('2026-07-28', CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, true, 1000, 900);
			expect(service.record('2026-07-29', CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, true, 1000, 800)).toBe(false);
			expect(service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, true, 1000, 1200)).toBe(true);
		});
	});

	describe('closed month rollup', () => {
		const july = new Date(2026, 6, 30);

		function seedThreeMonths(): void {
			vi.spyOn(service, 'now').mockReturnValue(july);
			service.record('2026-05-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 500);
			service.record('2026-06-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 700);
			service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 300);
			expect(months.size).toBe(3);
		}

		it('folds every month before the current one, and reads none of them again', () => {
			seedThreeMonths();

			session(july).refresh();
			expect(meta?.rollup?.through).toBe('2026-06');
			expect(meta?.rollup?.played).toBe(2);
			expect(meta?.rollup?.won).toBe(2);

			mockStorage.getDailyMonth.mockClear();
			const later = session(july);
			later.refresh();

			// only the month still open is parsed; May and June come off the rollup
			expect(new Set(mockStorage.getDailyMonth.mock.calls.map(call => call[0]))).toEqual(new Set(['2026-07']));
			expect(later.played()).toBe(3);
			expect(later.won()).toBe(3);
			expect(later.bestScore(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH)).toBe(700);
		});

		it('totals the same either way', () => {
			seedThreeMonths();
			const rolled = session(july);
			rolled.refresh();

			meta = { ...meta!, rollup: undefined };
			const scanned = session(july);
			scanned.refresh();

			expect(rolled.played()).toBe(scanned.played());
			expect(rolled.won()).toBe(scanned.won());
			expect(rolled.bestScores()).toEqual(scanned.bestScores());
		});

		it('folds the month that just closed when the year turns over', () => {
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 11, 20));
			service.record('2026-12-20', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 100);
			session(new Date(2026, 11, 21)).refresh();
			// nothing has closed yet, so there is nothing to fold and no rollup to write
			expect(meta?.rollup).toBeUndefined();

			const january = session(new Date(2027, 0, 5));
			january.refresh();

			expect(meta?.rollup?.through).toBe('2026-12');
			expect(january.played()).toBe(1);
		});

		it('rebuilds a rollup written by a different store version', () => {
			seedThreeMonths();
			session(july).refresh();
			meta = { ...meta!, rollup: { ...meta!.rollup!, v: 99, played: 999, won: 999 } };

			const next = session(july);
			next.refresh();

			expect(next.played()).toBe(3);
			expect(meta?.rollup?.v).toBe(1);
			expect(meta?.rollup?.played).toBe(2);
		});

		it('rebuilds when the device date moves back before the folded months', () => {
			seedThreeMonths();
			session(july).refresh();
			expect(meta?.rollup?.through).toBe('2026-06');

			// a rollup reaching into or past the current month is dropped rather than kept for later:
			// a day recorded into an already folded month would be lost if it were trusted again
			const backInMay = session(new Date(2026, 4, 15));
			backInMay.refresh();

			expect(meta?.rollup).toBeUndefined();
			expect(backInMay.played()).toBe(3);
			expect(backInMay.bestScore(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH)).toBe(700);
		});

		it('counts a day recorded while the date was back, once the rollup rebuilds', () => {
			seedThreeMonths();
			session(july).refresh();

			const backInMay = session(new Date(2026, 4, 15));
			backInMay.record('2026-05-15', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 900);

			const backInJuly = session(july);
			backInJuly.refresh();

			expect(backInJuly.played()).toBe(4);
			expect(backInJuly.bestScore(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH)).toBe(900);
		});

		it('keeps the streak across a fold', () => {
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 7, 2));
			for (const day of ['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']) {
				service.record(day, CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			}

			const august = session(new Date(2026, 7, 2));
			august.refresh();

			// the walk crosses into July, which the rollup no longer serves - the streak reads it directly
			expect(meta?.rollup?.through).toBe('2026-07');
			expect(august.streak()).toBe(4);
		});
	});

	describe('best scores', () => {
		it('lists every challenge, unplayed ones without a score', () => {
			service.refresh(new Date(2026, 6, 30));
			const bests = service.bestScores();
			expect(bests).toHaveLength(CHALLENGE_IDS.length);
			expect(bests.map(best => best.challenge)).toEqual(CHALLENGE_IDS);
			expect(bests.every(best => best.score === undefined)).toBe(true);
		});

		it('keeps the highest score per challenge with the day it was set', () => {
			service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 400);
			service.record('2026-07-11', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 900);
			service.record('2026-07-12', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 700);
			const best = service.bestScores().find(entry => entry.challenge === CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
			expect(best?.score).toBe(900);
			expect(best?.dayKey).toBe('2026-07-11');
		});

		it('keeps the challenges apart', () => {
			service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 400);
			service.record('2026-07-11', CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, true, 1000, 2500);
			expect(service.bestScore(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH)).toBe(400);
			expect(service.bestScore(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE)).toBe(2500);
		});

		it('counts a score from a lost run', () => {
			service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, false, 1000, 1200);
			expect(service.bestScore(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE)).toBe(1200);
		});

		it('spans months', () => {
			service.record('2026-07-31', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 300);
			service.record('2026-08-01', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 800);
			expect(service.bestScore(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH)).toBe(800);
		});

		it('reports a new best only when the score beats every earlier run', () => {
			expect(service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 400)).toBe(true);
			expect(service.record('2026-07-11', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 300)).toBe(false);
			expect(service.record('2026-07-12', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 400)).toBe(false);
			expect(service.record('2026-07-13', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 401)).toBe(true);
		});

		it('does not report a scoreless run as a new best', () => {
			expect(service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_BLACKOUT, false, 1000, 0)).toBe(false);
		});

		it('weighs the stored months even when the score board was never loaded', () => {
			service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 5000);
			// a reload mid-run leaves the store filled but the signal empty, since only the daily dialog fills it
			service.bestScores.set([]);
			expect(service.record('2026-07-11', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 300)).toBe(false);
			service.bestScores.set([]);
			expect(service.record('2026-07-12', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 5001)).toBe(true);
		});

		it('compares against the same challenge only', () => {
			service.record('2026-07-10', CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, true, 1000, 5000);
			expect(service.record('2026-07-11', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 100)).toBe(true);
		});
	});

	describe('streak', () => {
		beforeEach(() => {
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 6, 30));
		});

		it('counts consecutive winning days ending today', () => {
			service.record('2026-07-28', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-29', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(service.streak()).toBe(3);
		});

		it('keeps yesterday\'s streak alive while today is unplayed', () => {
			service.record('2026-07-28', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-29', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.refresh();
			expect(service.streak()).toBe(2);
		});

		it('breaks on a missed day', () => {
			service.record('2026-07-27', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(service.streak()).toBe(1);
		});

		it('does not count a lost day', () => {
			service.record('2026-07-29', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, false, 1000, 10);
			expect(service.streak()).toBe(1);
		});

		it('crosses a month boundary', () => {
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 7, 1));
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-31', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-08-01', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(service.streak()).toBe(3);
		});

		it('remembers the best streak after it breaks', () => {
			service.record('2026-07-28', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-29', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(service.bestStreak()).toBe(3);
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 7, 5));
			service.refresh();
			expect(service.streak()).toBe(0);
			expect(service.bestStreak()).toBe(3);
		});

		it('recomputes a corrupted meta streak from the month records', () => {
			meta = { v: 1, streak: 99, best: 1, played: 0, won: 0 };
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(service.streak()).toBe(1);
		});

		it('totals played and won across months', () => {
			service.record('2026-07-29', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			service.record('2026-07-30', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, false, 1000, 10);
			service.record('2026-08-01', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			expect(service.played()).toBe(3);
			expect(service.won()).toBe(2);
		});
	});

	describe('calendar', () => {
		beforeEach(() => {
			vi.spyOn(service, 'now').mockReturnValue(new Date(2026, 6, 30));
		});

		it('builds every day of the month', () => {
			service.refresh();
			const calendar = service.calendar();
			expect(calendar?.monthKey).toBe('2026-07');
			expect(calendar?.days).toHaveLength(31);
			expect(calendar?.days[0].day).toBe(1);
		});

		it('flags today and future days', () => {
			service.refresh();
			const days = service.calendar()?.days ?? [];
			expect(days.find(day => day.day === 30)?.today).toBe(true);
			expect(days.find(day => day.day === 29)?.future).toBe(false);
			expect(days.find(day => day.day === 31)?.future).toBe(true);
		});

		it('exposes the weekday of the first day', () => {
			service.refresh();
			// 2026-07-01 is a Wednesday
			expect(service.calendar()?.firstWeekday).toBe(3);
		});

		it('attaches results to their day', () => {
			service.record('2026-07-15', CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, true, 1000, 10);
			const day = service.calendar()?.days.find(entry => entry.day === 15);
			expect(day?.result?.won).toBe(true);
		});

		it('navigates to the previous and next month', () => {
			service.refresh();
			service.shiftMonth(-1);
			expect(service.calendar()?.monthKey).toBe('2026-06');
			service.shiftMonth(1);
			expect(service.calendar()?.monthKey).toBe('2026-07');
		});

		it('handles February in a leap year', () => {
			vi.spyOn(service, 'now').mockReturnValue(new Date(2028, 1, 10));
			service.refresh();
			expect(service.calendar()?.days).toHaveLength(29);
		});
	});

	it('uses the local calendar date for today', () => {
		const now = new Date(2026, 6, 30, 23, 59);
		vi.spyOn(service, 'now').mockReturnValue(now);
		service.refresh();
		expect(service.calendar()?.days.find(day => day.today)?.dayKey).toBe(dailyKey(now));
	});
});
