import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DailyChallengeComponent } from './daily-challenge.component';
import { DailyService, type DailyEntry } from '../../service/daily.service';
import { LayoutService } from '../../service/layout.service';
import { AppService } from '../../service/app.service';
import {
	CHALLENGE_CODES,
	CHALLENGE_IDS,
	CHALLENGE_MAX_TILE_COUNT,
	CHALLENGE_PURGE_TIME_PER_BOARD_TILE,
	CHALLENGE_PURGE_TIME_PER_TARGET,
	Challenges
} from '../../model/challenge/consts';
import { SCORE_BASE_POINTS, SCORE_COMBO_STEPS, SCORE_COMBO_WINDOW, SCORE_LAYER_BONUS } from '../../model/challenge/score';
import type { Layout, Mapping } from '../../model/types';

function layout(): Layout {
	return { id: 'daily-board', name: 'Daily Board', category: 'Test', mapping: [[0, 0, 0], [0, 2, 0]] };
}

function fullMapping(): Mapping {
	return Array.from({ length: CHALLENGE_MAX_TILE_COUNT }, (_value, index) => [0, index * 2, 0]);
}

describe('DailyChallengeComponent', () => {
	let component: DailyChallengeComponent;
	let fixture: ComponentFixture<DailyChallengeComponent>;
	let daily: DailyService;
	let entry: DailyEntry;

	beforeEach(async () => {
		entry = {
			dayKey: '2026-07-30',
			seed: 'daily-2026-07-30',
			challenge: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE,
			layout: layout(),
			generated: false
		};
		await TestBed.configureTestingModule({
			imports: [DailyChallengeComponent],
			providers: [
				provideTranslateService(),
				provideHttpClient(),
				provideHttpClientTesting(),
				DailyService,
				{ provide: LayoutService, useValue: { getPreview: () => 'preview-url', get: async () => ({ items: [layout()] }) } }
			]
		}).compileComponents();
		daily = TestBed.inject(DailyService);
		vi.spyOn(daily, 'now').mockReturnValue(new Date(2026, 6, 30));
		vi.spyOn(daily, 'resolve').mockResolvedValue(entry);
		fixture = TestBed.createComponent(DailyChallengeComponent);
		component = fixture.componentInstance;
	});

	it('creates', () => {
		fixture.detectChanges();
		expect(component).toBeTruthy();
	});

	it('resolves today and clears the loading state', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		expect(component.loading()).toBe(false);
		expect(component.entry()?.dayKey).toBe('2026-07-30');
	});

	it('exposes the challenge info for the resolved day', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		expect(component.info()?.id).toBe(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
		expect(component.timeLimitRange()).toEqual({ min: 180_000, max: 180_000 });
	});

	it('reports no time limit for an untimed challenge', async () => {
		entry.challenge = CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH;
		fixture.detectChanges();
		await fixture.whenStable();
		expect(component.timeLimitRange()).toBeUndefined();
	});

	// the purge adds time per target tile at start, so its limit spans the smallest and the largest suit
	it('announces a time span for the purge', async () => {
		entry.challenge = CHALLENGE_CODES.CHALLENGE_THE_PURGE;
		entry.layout = { ...layout(), mapping: fullMapping() };
		fixture.detectChanges();
		await fixture.whenStable();
		expect(component.info()?.timeLimitPerTile).toBe(CHALLENGE_PURGE_TIME_PER_BOARD_TILE);
		const base = CHALLENGE_MAX_TILE_COUNT * CHALLENGE_PURGE_TIME_PER_BOARD_TILE;
		// the 8 bonus tiles are the smallest suit group on a full board, a suit of 36 the largest
		const span = { min: base + (8 * CHALLENGE_PURGE_TIME_PER_TARGET), max: base + (36 * CHALLENGE_PURGE_TIME_PER_TARGET) };
		expect(component.timeLimitRange()).toEqual(span);
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_THE_PURGE, new Event('click'));
		expect(component.challengeDetails()?.timeLimit).toEqual(span);
	});

	it('renders the board preview', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		expect(component.preview()).toBe('preview-url');
	});

	it('emits the resolved entry on start', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		let emitted: DailyEntry | undefined;
		component.startEvent.subscribe(value => {
			emitted = value;
		});
		component.onStart();
		expect(emitted?.dayKey).toBe('2026-07-30');
	});

	it('does not emit before the entry resolved', () => {
		let emitted = false;
		component.startEvent.subscribe(() => {
			emitted = true;
		});
		component.onStart();
		expect(emitted).toBe(false);
	});

	it('builds the calendar for the current month', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		expect(daily.calendar()?.monthKey).toBe('2026-07');
		expect(component.monthLabel()).toContain('2026');
		expect(component.monthLabel().length).toBeGreaterThan(4);
	});

	it('starts the week on Monday and ends it on Sunday', () => {
		TestBed.inject(AppService).lang.set('en');
		fixture.detectChanges();
		const weekdays = component.weekdays();
		expect(weekdays).toHaveLength(7);
		for (const weekday of weekdays) {
			expect(weekday.short).toBeTruthy();
			expect(weekday.long).toBeTruthy();
		}
		expect(weekdays[0].long.toLowerCase()).toContain('mon');
		expect(weekdays[6].long.toLowerCase()).toContain('sun');
		// 2026-07-01 is a Wednesday, the third column of a Monday-first week
		expect(component.blanks()).toHaveLength(2);
	});

	it('keeps the Monday-first week in every locale, translating only the names', () => {
		TestBed.inject(AppService).lang.set('de');
		fixture.detectChanges();
		expect(component.weekdays().map(weekday => weekday.long)).toEqual([
			'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'
		]);
		expect(component.blanks()).toHaveLength(2);

		// en-US and ar would both start the week elsewhere if the locale still had a say
		TestBed.inject(AppService).lang.set('ar');
		fixture.detectChanges();
		expect(component.weekdays()).toHaveLength(7);
		expect(component.blanks()).toHaveLength(2);
	});

	it('pads a month that starts on a Sunday with a full week of blanks', () => {
		fixture.detectChanges();
		// 2026-11-01 is a Sunday, the last column of a Monday-first week
		daily.showMonth(new Date(2026, 10, 1));
		expect(component.blanks()).toHaveLength(6);
	});

	it('pads nothing for a month that starts on a Monday', () => {
		fixture.detectChanges();
		// 2026-06-01 is a Monday
		daily.showMonth(new Date(2026, 5, 1));
		expect(component.blanks()).toHaveLength(0);
	});

	it('renders one cell per day plus the weekday header', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		expect(fixture.nativeElement.querySelectorAll('.calendar-weekday')).toHaveLength(7);
		expect(fixture.nativeElement.querySelectorAll('.calendar-day')).toHaveLength(31);
	});

	it('exposes the calendar as a list of days and nothing else', async () => {
		fixture.detectChanges();
		await fixture.whenStable();

		const list = fixture.nativeElement.querySelector('.calendar-grid') as HTMLElement;
		expect(list.getAttribute('role')).toBe('list');
		// every day is an item, and the padding and the column headers are not
		expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(31);
		for (const cell of list.querySelectorAll('.calendar-day')) {
			expect(cell.getAttribute('role')).toBe('listitem');
			expect(cell.getAttribute('aria-hidden')).toBeNull();
		}
		for (const decoration of list.querySelectorAll('.calendar-weekday, .calendar-blank')) {
			expect(decoration.getAttribute('aria-hidden')).toBe('true');
		}
		// read-only cells, so no tab stop that leads nowhere
		expect(list.querySelector('[tabindex]')).toBeNull();
	});

	it('names the weekday in the cell, since the column header is hidden', async () => {
		TestBed.inject(AppService).lang.set('en');
		fixture.detectChanges();
		await fixture.whenStable();

		// 2026-07-01 is a Wednesday
		const first = daily.calendar()!.days[0];
		expect(component.dayLabel(first)).toContain('Wednesday');
		expect(component.dayTitle(first)).toContain('Wednesday');
	});

	it('pads the calendar with leading blanks', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		// 2026-07-01 is a Wednesday, so Monday and Tuesday are blank
		expect(component.blanks()).toHaveLength(2);
	});

	it('navigates months', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		const july = component.monthLabel();
		component.shiftMonth(-1);
		expect(daily.calendar()?.monthKey).toBe('2026-06');
		expect(component.monthLabel()).not.toBe(july);
		component.shiftMonth(1);
		expect(daily.calendar()?.monthKey).toBe('2026-07');
		expect(component.monthLabel()).toBe(july);
	});

	it('opens and closes the scoring popup from the info button', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		// zoneless: the resolved entry needs one more pass before it is in the dom
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector(':scope .info-overlay')).toBeFalsy();

		(fixture.nativeElement.querySelector(':scope .daily-scores .info-label') as HTMLElement).click();
		fixture.detectChanges();

		const popup = fixture.nativeElement.querySelector(':scope .info-overlay .info-popup') as HTMLElement;
		expect(popup).toBeTruthy();
		expect(popup.getAttribute('role')).toBe('dialog');
		expect(popup.getAttribute('aria-modal')).toBe('true');

		(popup.querySelector('.close') as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector(':scope .info-overlay')).toBeFalsy();
	});

	it('keeps tab inside the popup and still swallows keys from the board behind it', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		component.openScoringInfo(new Event('click'));
		fixture.detectChanges();

		const popup = fixture.nativeElement.querySelector(':scope .info-overlay .info-popup') as HTMLElement;
		const outer = vi.fn();
		fixture.nativeElement.addEventListener('keydown', outer);
		const trapped = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		popup.dispatchEvent(trapped);

		// the popup is a modal, so neither tab nor a game shortcut may reach past it
		expect(outer).not.toHaveBeenCalled();
		// jsdom reports every element as hidden, so assert the wiring rather than the wrap itself
		expect(popup.querySelectorAll('button').length).toBeGreaterThan(0);
	});

	it('opens the challenge explainer from anywhere in a score row', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		// zoneless: the resolved entry needs one more pass before it is in the dom
		fixture.detectChanges();

		const rows = fixture.nativeElement.querySelectorAll(':scope .scores-list .score-row');
		const index = CHALLENGE_IDS.indexOf(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		(rows[index] as HTMLElement).click();
		fixture.detectChanges();

		expect(component.challengeInfoId()).toBe(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		const popup = fixture.nativeElement.querySelector(':scope .info-overlay .info-popup') as HTMLElement;
		expect(popup.textContent).toContain('CHALLENGE_MIDAS_MATCH_DESC');
	});

	it('shows the special tile of a challenge that marks one', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, new Event('click'));
		fixture.detectChanges();

		expect(component.challengeDetails()?.markLabel).toBe('MARK_MIDAS');
		expect(fixture.nativeElement.querySelector(':scope .special-tile app-tile-preview g.draw.mark-midas')).toBeTruthy();
	});

	it('leaves out the special tile for a challenge without one', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, new Event('click'));
		fixture.detectChanges();

		expect(component.challengeDetails()?.mark).toBeUndefined();
		expect(fixture.nativeElement.querySelector(':scope .special-tile')).toBeFalsy();
	});

	it('lists the targets a challenge sets', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, new Event('click'));
		fixture.detectChanges();

		const facts = fixture.nativeElement.querySelectorAll(':scope .info-popup .daily-facts .fact dd');
		expect([...facts].map((fact: Element) => fact.textContent?.trim())).toEqual(['03:00', '30']);
	});

	it('starts the picked challenge on a dev shift-click instead of explaining it', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		let emitted: DailyEntry | undefined;
		component.startEvent.subscribe(value => {
			emitted = value;
		});
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_BLACKOUT, new MouseEvent('click', { shiftKey: true }));

		expect(emitted?.challenge).toBe(CHALLENGE_CODES.CHALLENGE_BLACKOUT);
		expect(emitted?.dayKey).toBe('2026-07-30');
		expect(emitted?.layout.id).toBe('daily-board');
		expect(component.challengeInfoId()).toBeUndefined();
	});

	it('opens the explainer when the click carries no shift key', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		let emitted = false;
		component.startEvent.subscribe(() => {
			emitted = true;
		});
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_BLACKOUT, new MouseEvent('click'));

		expect(emitted).toBe(false);
		expect(component.challengeInfoId()).toBe(CHALLENGE_CODES.CHALLENGE_BLACKOUT);
	});

	it('replaces the scoring popup when a challenge explainer is opened', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		component.openScoringInfo(new Event('click'));
		component.openChallengeInfo(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, new Event('click'));
		fixture.detectChanges();

		expect(component.scoringInfo()).toBe(false);
		expect(fixture.nativeElement.querySelectorAll(':scope .info-overlay').length).toBe(1);
	});

	it('explains the scoring with the values the game actually awards', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		component.openScoringInfo(new Event('click'));
		fixture.detectChanges();

		const rules = fixture.nativeElement.querySelectorAll(':scope .info-popup .scoring-rule');
		expect(rules.length).toBe(component.scoringRules.length);
		const values = component.scoringRules.map(rule => rule.parameters);
		expect(values[0]?.points).toBe(SCORE_BASE_POINTS);
		expect(values[1]?.points).toBe(SCORE_LAYER_BONUS);
		expect(values[2]?.seconds).toBe(SCORE_COMBO_WINDOW / 1000);
		expect(values[2]?.steps).toBe(SCORE_COMBO_STEPS.map(step => `x${step}`).join('  '));
	});

	it('lists one score row per challenge', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		expect(fixture.nativeElement.querySelectorAll(':scope .daily-scores .score-row')).toHaveLength(Challenges.length);
		expect(component.hasScores()).toBe(false);
		expect(fixture.nativeElement.querySelector(':scope .daily-scores .scores-hint')).toBeTruthy();
	});

	it('renders a recorded best score and hides the empty hint', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		// after the init refresh, which recomputes the board from storage
		daily.bestScores.set([{ challenge: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, score: 4880, dayKey: '2026-07-04', won: true }]);
		fixture.detectChanges();
		const row = fixture.nativeElement.querySelector(':scope .daily-scores .score-row') as HTMLElement;
		expect(row.classList.contains('empty')).toBe(false);
		// today resolves to Match Attack, so the row for it is marked as the current challenge
		expect(row.classList.contains('current')).toBe(true);
		expect(row.querySelector('.score-value')?.textContent).toContain('4880');
		expect(row.querySelector('.score-date')?.textContent?.trim()).toBeTruthy();
		expect(component.hasScores()).toBe(true);
		expect(fixture.nativeElement.querySelector(':scope .daily-scores .scores-hint')).toBeFalsy();
	});

	it('marks a challenge without a score as empty', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		daily.bestScores.set([{ challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH }]);
		fixture.detectChanges();
		const row = fixture.nativeElement.querySelector(':scope .daily-scores .score-row') as HTMLElement;
		expect(row.classList.contains('empty')).toBe(true);
		expect(row.querySelector('.score-date')?.textContent?.trim()).toBe('');
	});

	it('formats the date of a best score, and leaves an unset one blank', () => {
		expect(component.bestDate({ challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, score: 10, dayKey: '2026-07-04' })).toBeTruthy();
		expect(component.bestDate({ challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH })).toBe('');
		expect(component.bestDateLong({ challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, score: 10, dayKey: '2026-07-04' })).toContain('2026');
		expect(component.bestDateLong({ challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH })).toBe('');
	});

	it('puts the result and the score into the calendar day tooltip', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		const day = daily.calendar()!.days[3];
		expect(component.dayTitle(day)).toBe(component.dayLabel(day));

		day.result = { challenge: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, won: true, attempts: 1, firstTry: true, score: 1234 };
		const title = component.dayTitle(day);
		expect(title).toContain('CHALLENGE_THIRTY_IN_THREE');
		expect(title).toContain('DAILY_COMPLETED');
		expect(title).toContain('1234');
	});

	it('leaves the score out of the tooltip when none was scored', () => {
		fixture.detectChanges();
		const day = daily.calendar()!.days[3];
		day.result = { challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, won: false, attempts: 2, firstTry: false, score: 0 };
		const title = component.dayTitle(day);
		expect(title).toContain('DAILY_NOT_COMPLETED');
		expect(title).not.toContain('CHALLENGE_SCORE');
	});

	it('says a past day was not completed rather than not completed yet', () => {
		fixture.detectChanges();
		const days = daily.calendar()!.days;
		const lost = { challenge: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, won: false, attempts: 1, firstTry: false };
		const past = days.find(day => !day.today && !day.future)!;
		const today = days.find(day => day.today)!;
		past.result = { ...lost };
		today.result = { ...lost };
		// a day that is over can no longer be completed, so the hopeful wording is only for today
		expect(component.dayTitle(past)).toContain('DAILY_NOT_COMPLETED_PAST');
		expect(component.dayTitle(today)).toContain('DAILY_NOT_COMPLETED');
		expect(component.dayTitle(today)).not.toContain('DAILY_NOT_COMPLETED_PAST');
	});

	it('marks a played day in the grid and puts its score in the tooltip', async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		const calendar = daily.calendar()!;
		calendar.days[3].result = { challenge: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, won: false, attempts: 1, firstTry: false, score: 640 };
		daily.calendar.set({ ...calendar });
		fixture.detectChanges();

		const cell = fixture.nativeElement.querySelectorAll(':scope .calendar-day')[3] as HTMLElement;
		expect(cell.classList.contains('lost')).toBe(true);
		expect(cell.classList.contains('won')).toBe(false);
		expect(cell.getAttribute('title')).toContain('640');
	});

	it('survives a failing resolve', async () => {
		vi.spyOn(daily, 'resolve').mockRejectedValue(new Error('nope'));
		const failing = TestBed.createComponent(DailyChallengeComponent);
		failing.detectChanges();
		await new Promise(resolve => setTimeout(resolve, 0));
		await failing.whenStable();
		expect(failing.componentInstance.loading()).toBe(false);
		expect(failing.componentInstance.entry()).toBeUndefined();
	});
});
