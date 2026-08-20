import { inject, Service, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { DailyBestStore, DailyMetaStore, DailyMonthStore, DailyResultStore, DailyRollupStore, Layout } from '../model/types';
import { type CHALLENGE_ID, CHALLENGE_IDS, CHALLENGE_MAX_TILE_COUNT, challengeFromCode, challengeInfo, minimumTileCount } from '../model/challenge/consts';
import {
	dailyKey,
	dailyLayoutId,
	dailyMonthKey,
	dailySeed,
	isGeneratedLayoutDay,
	pickDailyChallenge,
	pickDailyItem
} from '../model/challenge/daily';
import { generateSeededRandomMapping } from '../model/random-layout/random-layout';
import { LayoutService } from './layout.service';
import { LocalstorageService } from './localstorage.service';

export interface DailyEntry {
	dayKey: string;
	seed: string;
	challenge: CHALLENGE_ID;
	layout: Layout;
	generated: boolean;
	result?: DailyResultStore;
}

export interface DailyCalendarDay {
	dayKey: string;
	date: Date;
	day: number;
	today: boolean;
	future: boolean;
	result?: DailyResultStore;
}

export interface DailyBestScore {
	challenge: CHALLENGE_ID;
	score?: number;
	dayKey?: string;
	won?: boolean;
}

interface DailyTotals {
	played: number;
	won: number;
	bestScores: Array<DailyBestScore>;
}

export interface DailyCalendar {
	monthKey: string;
	year: number;
	month: number;
	// weekday of the 1st in Date.getDay() numbering - the view pads the Monday-first grid from it
	firstWeekday: number;
	days: Array<DailyCalendarDay>;
}

const STORE_VERSION = 1;

function nextWinPlayTime(previous: DailyResultStore | undefined, won: boolean, playTime: number): number | undefined {
	if (!won) {
		return previous?.playTime;
	}
	if (previous?.playTime === undefined) {
		return playTime;
	}
	return Math.min(previous.playTime, playTime);
}

function previousDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
}

@Service()
export class DailyService {
	readonly streak = signal(0);
	readonly bestStreak = signal(0);
	readonly played = signal(0);
	readonly won = signal(0);
	readonly todayResult = signal<DailyResultStore | undefined>(undefined);
	readonly calendar = signal<DailyCalendar | undefined>(undefined);
	readonly bestScores = signal<Array<DailyBestScore>>([]);

	private readonly storage = inject(LocalstorageService);
	private readonly layoutService = inject(LayoutService);
	private readonly translate = inject(TranslateService);
	private readonly generatedLayouts = new Map<string, Layout>();
	private readonly monthCache = new Map<string, DailyMonthStore | undefined>();
	private monthKeyCache?: Array<string>;
	private totalsCache?: DailyTotals;

	now(): Date {
		return new Date();
	}

	async resolve(date: Date = this.now()): Promise<DailyEntry> {
		const key = dailyKey(date);
		const seed = dailySeed(key);
		const generated = isGeneratedLayoutDay(date);
		const challenge = pickDailyChallenge(key);
		const layout = generated ? this.generateLayout(key) : await this.builtInLayout(key, challenge);
		return {
			dayKey: key,
			seed,
			challenge,
			layout,
			generated,
			result: this.getResult(key)
		};
	}

	getResult(dayKey: string): DailyResultStore | undefined {
		return this.readMonth(dailyMonthKey(dayKey))?.days?.[dayKey];
	}

	loadTodayResult(date: Date = this.now()): DailyResultStore | undefined {
		const result = this.getResult(dailyKey(date));
		this.todayResult.set(result);
		return result;
	}

	// returns true when this run beat every earlier score for the same challenge type
	record(dayKey: string, challenge: CHALLENGE_ID, won: boolean, playTime: number, score: number): boolean {
		const previousBest = this.bestScore(challenge);
		const monthKey = dailyMonthKey(dayKey);
		const month: DailyMonthStore = this.readMonth(monthKey) ?? { v: STORE_VERSION, days: {} };
		month.days ??= {};
		const previous = month.days[dayKey];
		const attempts = (previous?.attempts ?? 0) + 1;
		const alreadyWon = previous?.won;
		month.days[dayKey] = {
			challenge,
			won: alreadyWon || won,
			attempts,
			firstTry: alreadyWon ? previous.firstTry : (won && attempts === 1),
			playTime: nextWinPlayTime(previous, won, playTime),
			score: Math.max(previous?.score ?? 0, score)
		};
		this.storage.storeDailyMonth(monthKey, month);
		this.monthCache.set(monthKey, month);
		if (!this.readMonthKeys().includes(monthKey)) {
			this.monthKeyCache = [...this.readMonthKeys(), monthKey];
		}
		this.applyToTotals(dayKey, month.days[dayKey], previous);
		this.refresh();
		return score > 0 && score > previousBest;
	}

	// reads the store, not the signal - the signal only fills once the daily dialog has been opened
	bestScore(challenge: CHALLENGE_ID): number {
		return this.collectResults().bestScores.find(best => best.challenge === challenge)?.score ?? 0;
	}

	refresh(date: Date = this.now()): void {
		const key = dailyKey(date);
		this.loadTodayResult(date);
		const streak = this.computeStreak(date);
		const totals = this.collectResults();
		this.bestScores.set(totals.bestScores);
		const meta = this.storage.getDailyMeta();
		const best = Math.max(meta?.best ?? 0, streak);
		this.streak.set(streak);
		this.bestStreak.set(best);
		this.played.set(totals.played);
		this.won.set(totals.won);
		this.storeMeta({ streak, best, last: key, played: totals.played, won: totals.won });
		this.showMonth(date);
	}

	showMonth(date: Date): void {
		const year = date.getFullYear();
		const month = date.getMonth();
		const todayKey = dailyKey(this.now());
		const firstDay = new Date(year, month, 1);
		const monthKey = dailyMonthKey(dailyKey(firstDay));
		const results = this.readMonth(monthKey)?.days ?? {};
		// day 0 of the following month is the last day of this one
		const dayCount = new Date(year, month + 1, 0).getDate();
		const days: Array<DailyCalendarDay> = [];
		for (let day = 1; day <= dayCount; day++) {
			const key = dailyKey(new Date(year, month, day));
			days.push({
				dayKey: key,
				date: new Date(year, month, day),
				day,
				today: key === todayKey,
				future: key > todayKey,
				result: results[key]
			});
		}
		this.calendar.set({
			monthKey,
			year,
			month,
			firstWeekday: firstDay.getDay(),
			days
		});
	}

	shiftMonth(offset: number): void {
		const current = this.calendar();
		const base = current ? new Date(current.year, current.month, 1) : this.now();
		this.showMonth(new Date(base.getFullYear(), base.getMonth() + offset, 1));
	}

	private computeStreak(date: Date): number {
		// an unplayed today must not erase the run that ended yesterday
		const today = this.getResult(dailyKey(date));
		let cursor = today?.won ? date : previousDay(date);
		let streak = 0;
		while (this.getResult(dailyKey(cursor))?.won) {
			streak++;
			cursor = previousDay(cursor);
		}
		return streak;
	}

	private readMonth(monthKey: string): DailyMonthStore | undefined {
		if (!this.monthCache.has(monthKey)) {
			this.monthCache.set(monthKey, this.storage.getDailyMonth(monthKey));
		}
		return this.monthCache.get(monthKey);
	}

	private readMonthKeys(): Array<string> {
		this.monthKeyCache ??= this.storage.getDailyMonthKeys();
		return this.monthKeyCache;
	}

	private applyToTotals(dayKey: string, entry: DailyResultStore, previous?: DailyResultStore): void {
		const totals = this.totalsCache;
		if (!totals) {
			return;
		}
		const challenge = challengeFromCode(entry.challenge);
		const score = entry.score ?? 0;
		const bestScores = totals.bestScores.map(best =>
			(challenge && best.challenge === challenge && score > 0 && score > (best.score ?? 0)) ?
				{ challenge, score, dayKey, won: entry.won } :
				best
		);
		this.totalsCache = {
			played: totals.played + (previous ? 0 : 1),
			won: totals.won + ((entry.won && !previous?.won) ? 1 : 0),
			bestScores
		};
	}

	// only the current month can still be written, so everything before it is folded in once and skipped
	private foldClosedMonths(currentMonth: string): DailyRollupStore {
		const stored = this.storage.getDailyMeta()?.rollup;
		const usable = stored?.v === STORE_VERSION && stored.through < currentMonth;
		const rollup: DailyRollupStore = usable ?
			{ ...stored, bests: [...stored.bests] } :
			{ v: STORE_VERSION, through: '', played: 0, won: 0, bests: [] };
		const pending = this.readMonthKeys()
			.filter(monthKey => monthKey > rollup.through && monthKey < currentMonth)
			.sort((a, b) => a.localeCompare(b));
		if (pending.length === 0) {
			if (stored && !usable) {
				this.storeMeta({ rollup: undefined });
			}
			return rollup;
		}
		const bests = new Map<number, DailyBestStore>(rollup.bests.map(best => [best.challenge, best]));
		for (const monthKey of pending) {
			const days = Object.entries(this.readMonth(monthKey)?.days ?? {});
			for (const [dayKey, result] of days) {
				rollup.played++;
				if (result.won) {
					rollup.won++;
				}
				const score = result.score ?? 0;
				const best = bests.get(result.challenge);
				if (score > 0 && (!best || score > best.score)) {
					bests.set(result.challenge, { challenge: result.challenge, score, dayKey, won: result.won });
				}
			}
		}
		rollup.bests = Array.from(bests.values());
		rollup.through = pending.at(-1) ?? rollup.through;
		this.storeMeta({ rollup });
		return rollup;
	}

	private storeMeta(patch: Partial<DailyMetaStore>): void {
		const meta = this.storage.getDailyMeta();
		this.storage.storeDailyMeta({
			v: STORE_VERSION,
			streak: meta?.streak ?? 0,
			best: meta?.best ?? 0,
			last: meta?.last,
			played: meta?.played ?? 0,
			won: meta?.won ?? 0,
			rollup: meta?.rollup,
			...patch
		});
	}

	// totals and best scores read the same records, so one pass over the months still open serves both
	private collectResults(): DailyTotals {
		if (this.totalsCache) {
			return this.totalsCache;
		}
		const today = dailyKey(this.now());
		const rollup = this.foldClosedMonths(dailyMonthKey(today));
		let played = rollup.played;
		let won = rollup.won;
		const bests = new Map<number, DailyBestScore>();
		for (const best of rollup.bests) {
			const challenge = challengeFromCode(best.challenge);
			if (challenge) {
				bests.set(best.challenge, { challenge, score: best.score, dayKey: best.dayKey, won: best.won });
			}
		}
		for (const monthKey of this.readMonthKeys()) {
			if (monthKey <= rollup.through) {
				continue;
			}
			const days = Object.entries(this.readMonth(monthKey)?.days ?? {});
			for (const [dayKey, result] of days) {
				played++;
				if (result.won) {
					won++;
				}
				const challenge = challengeFromCode(result.challenge);
				const score = result.score ?? 0;
				const best = bests.get(result.challenge);
				if (challenge && score > 0 && (!best || score > (best.score ?? 0))) {
					bests.set(result.challenge, { challenge, score, dayKey, won: result.won });
				}
			}
		}
		// every challenge gets a row, so the board doubles as the list of what can turn up
		const bestScores = CHALLENGE_IDS.map(id => bests.get(id) ?? { challenge: id });
		this.totalsCache = { played, won, bestScores };
		return this.totalsCache;
	}

	private generateLayout(key: string): Layout {
		const layout = this.generatedLayouts.get(key) ?? {
			id: dailyLayoutId(key),
			name: '',
			category: 'DAILY_CHALLENGE',
			mapping: generateSeededRandomMapping(dailySeed(key), 'random', 'random', 'random')
		};
		layout.name = this.translate.instant('DAILY_GENERATED_BOARD');
		this.generatedLayouts.set(key, layout);
		return layout;
	}

	private async builtInLayout(key: string, challenge: CHALLENGE_ID): Promise<Layout> {
		const layouts = await this.layoutService.get();
		const minTiles = minimumTileCount(challengeInfo(challenge));
		const items = layouts.items.filter(layout =>
			!layout.custom && layout.mapping.length >= minTiles && layout.mapping.length <= CHALLENGE_MAX_TILE_COUNT);
		return pickDailyItem(key, 'layout', items, layout => layout.id) ?? this.generateLayout(key);
	}
}
