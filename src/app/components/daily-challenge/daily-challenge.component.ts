import { Component, ElementRef, type OnInit, computed, effect, inject, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DailyService, type DailyBestScore, type DailyCalendarDay, type DailyEntry } from '../../service/daily.service';
import { LayoutService } from '../../service/layout.service';
import { AppService } from '../../service/app.service';
import {
	CHALLENGE_CODES,
	CHALLENGE_MIDAS_CLEAR_BONUS,
	type CHALLENGE_ID,
	CHALLENGE_SPARKSTONE_BONUS,
	CHALLENGE_SPARKSTONE_SCORE_BONUS,
	MARK_LABELS,
	type StoneMark,
	announcedTimeLimit,
	challengeFromCode,
	challengeInfo,
	challengeName
} from '../../model/challenge/consts';
import { SCORE_BASE_POINTS, SCORE_COMBO_STEPS, SCORE_COMBO_WINDOW, SCORE_LAYER_BONUS } from '../../model/challenge/score';
import { parseDailyKey } from '../../model/challenge/daily';
import { trapFocus } from '../../model/dom-utilities';
import { log } from '../../model/log';
import { environment } from '../../../environments/environment';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IconFlameComponent } from '../icons/icon-flame.component';
import { IconTrophyComponent } from '../icons/icon-trophy.component';
import { IconLeftComponent } from '../icons/icon-left.component';
import { IconRightComponent } from '../icons/icon-right.component';
import { IconOkComponent } from '../icons/icon-ok.component';
import { IconInfoComponent } from '../icons/icon-info.component';
import { IconCloseComponent } from '../icons/icon-close.component';
import { TilePreviewComponent } from '../tile-preview/tile-preview.component';

// a week of known dates starting on a Monday, only ever used to read weekday names out of Intl
const WEEKDAY_SAMPLE = [5, 6, 7, 8, 9, 10, 11].map(day => new Date(2024, 1, day));

export interface ScoringRule {
	name: string;
	value: string;
	parameters?: Record<string, number | string>;
}

// read off the score constants so the explainer cannot drift from what the game awards
const SCORING_RULES: Array<ScoringRule> = [
	{ name: 'DAILY_SCORING_BASE', value: 'DAILY_SCORING_POINTS', parameters: { points: SCORE_BASE_POINTS } },
	{ name: 'DAILY_SCORING_DEPTH', value: 'DAILY_SCORING_DEPTH_VALUE', parameters: { points: SCORE_LAYER_BONUS } },
	{
		name: 'DAILY_SCORING_COMBO',
		value: 'DAILY_SCORING_COMBO_VALUE',
		parameters: {
			seconds: SCORE_COMBO_WINDOW / 1000,
			steps: SCORE_COMBO_STEPS.map(step => `x${step}`).join('  ')
		}
	},
	{ name: 'DAILY_SCORING_BREAK', value: 'DAILY_SCORING_BREAK_VALUE' },
	{
		name: challengeName(CHALLENGE_CODES.CHALLENGE_SPARKSTONE),
		value: 'DAILY_SCORING_SPARKSTONE_VALUE',
		parameters: { seconds: CHALLENGE_SPARKSTONE_BONUS / 1000, points: CHALLENGE_SPARKSTONE_SCORE_BONUS }
	},
	{
		name: challengeName(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH),
		value: 'DAILY_SCORING_MIDAS_VALUE',
		parameters: { points: CHALLENGE_MIDAS_CLEAR_BONUS }
	}
];

// only these three place a marked tile, so only they get a sample in the explainer
const CHALLENGE_MARKS: Partial<Record<CHALLENGE_ID, StoneMark>> = {
	[CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH]: 'midas',
	[CHALLENGE_CODES.CHALLENGE_SPARKSTONE]: 'spark',
	[CHALLENGE_CODES.CHALLENGE_THE_PURGE]: 'target'
};

// constructing a formatter costs far more than formatting with it, and the calendar formats every cell on each render
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(lang: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = `${lang}|${JSON.stringify(options)}`;
	let cached = formatters.get(key);
	if (!cached) {
		try {
			cached = new Intl.DateTimeFormat(lang || undefined, options);
		} catch {
			// an unknown or malformed language tag must not break the calendar
			cached = new Intl.DateTimeFormat(undefined, options);
		}
		formatters.set(key, cached);
	}
	return cached;
}

function formatDate(lang: string, date: Date, options: Intl.DateTimeFormatOptions): string {
	return formatter(lang, options).format(date);
}

@Component({
	selector: 'app-daily-challenge',
	templateUrl: './daily-challenge.component.html',
	styleUrls: ['./daily-challenge.component.scss'],
	imports: [
		TranslatePipe, DurationPipe, IconFlameComponent, IconTrophyComponent, IconLeftComponent, IconRightComponent, IconOkComponent,
		IconInfoComponent, IconCloseComponent, TilePreviewComponent
	]
})
export class DailyChallengeComponent implements OnInit {
	readonly startEvent = output<DailyEntry>();
	readonly daily = inject(DailyService);
	readonly app = inject(AppService);
	readonly entry = signal<DailyEntry | undefined>(undefined);
	readonly loading = signal(true);
	readonly scoringRules = SCORING_RULES;
	readonly scoringInfo = signal(false);
	readonly challengeInfoId = signal<CHALLENGE_ID | undefined>(undefined);
	readonly hasScores = computed(() => this.daily.bestScores().some(best => best.score !== undefined));
	readonly challengeName = challengeName;
	readonly devChallengeStart = !environment.production;

	readonly tileCount = computed(() => this.entry()?.layout.mapping.length ?? 0);

	readonly challengeDetails = computed(() => {
		const id = this.challengeInfoId();
		if (id === undefined) {
			return undefined;
		}
		const mark = CHALLENGE_MARKS[id];
		const info = challengeInfo(id);
		return {
			id, name: challengeName(id), info, timeLimit: announcedTimeLimit(info, this.tileCount()), mark, markLabel: mark ? MARK_LABELS[mark] : undefined
		};
	});

	readonly weekdays = computed(() => {
		const lang = this.app.lang();
		return WEEKDAY_SAMPLE.map(date => ({
			short: formatDate(lang, date, { weekday: 'short' }),
			long: formatDate(lang, date, { weekday: 'long' })
		}));
	});

	readonly info = computed(() => {
		const entry = this.entry();
		return entry ? challengeInfo(entry.challenge) : undefined;
	});

	readonly preview = computed(() => {
		const entry = this.entry();
		return entry ? this.layoutService.getPreview(entry.layout) : undefined;
	});

	readonly dateLabel = computed(() => {
		const date = parseDailyKey(this.entry()?.dayKey ?? '');
		return date ? formatDate(this.app.lang(), date, { dateStyle: 'full' }) : '';
	});

	readonly monthLabel = computed(() => {
		const calendar = this.daily.calendar();
		if (!calendar) {
			return '';
		}
		return formatDate(this.app.lang(), new Date(calendar.year, calendar.month, 1), { month: 'long', year: 'numeric' });
	});

	readonly blanks = computed(() => {
		// Date.getDay() puts Sunday at 0, the grid puts it last
		const offset = ((this.daily.calendar()?.firstWeekday ?? 1) + 6) % 7;
		return Array.from({ length: offset }, (_value, index) => index);
	});

	readonly timeLimitRange = computed(() => {
		const info = this.info();
		return info ? announcedTimeLimit(info, this.tileCount()) : undefined;
	});

	private readonly layoutService = inject(LayoutService);
	private readonly translate = inject(TranslateService);
	private readonly elementRef = inject(ElementRef);
	private previousFocus: Element | null = null;

	constructor() {
		effect(() => {
			if (this.scoringInfo() || this.challengeInfoId() !== undefined) {
				this.previousFocus = document.activeElement;
				setTimeout(() => {
					const popup = (this.elementRef.nativeElement as HTMLElement).querySelector<HTMLElement>('.info-popup');
					popup?.querySelector<HTMLElement>('button')?.focus();
				}, 0);
			} else {
				if (this.previousFocus instanceof HTMLElement) {
					this.previousFocus.focus();
				}
				this.previousFocus = null;
			}
		});
	}

	dayLabel(day: DailyCalendarDay): string {
		return formatDate(this.app.lang(), day.date, { dateStyle: 'full' }) || day.dayKey;
	}

	dayTitle(day: DailyCalendarDay): string {
		const parts = [this.dayLabel(day)];
		const result = day.result;
		if (result) {
			const missed = day.today ? 'DAILY_NOT_COMPLETED' : 'DAILY_NOT_COMPLETED_PAST';
			const challenge = challengeFromCode(result.challenge);
			parts.push(
				this.translate.instant(challenge === undefined ? 'DAILY_CHALLENGE' : challengeName(challenge)),
				this.translate.instant(result.won ? 'DAILY_COMPLETED' : missed)
			);
			if (result.score) {
				parts.push(`${this.translate.instant('CHALLENGE_SCORE')}: ${result.score}`);
			}
		}
		return parts.join(', ');
	}

	bestDate(best: DailyBestScore): string {
		const date = parseDailyKey(best.dayKey ?? '');
		return date ? formatDate(this.app.lang(), date, { month: 'short', day: 'numeric' }) : '';
	}

	bestDateLong(best: DailyBestScore): string {
		const date = parseDailyKey(best.dayKey ?? '');
		return date ? formatDate(this.app.lang(), date, { dateStyle: 'long' }) : '';
	}

	ngOnInit(): void {
		this.daily.refresh();
		this.daily.resolve()
			.then(entry => {
				this.entry.set(entry);
				this.loading.set(false);
			})
			.catch(error => {
				log.error(error);
				this.loading.set(false);
			});
	}

	onStart(): void {
		const entry = this.entry();
		if (entry) {
			this.startEvent.emit(entry);
		}
	}

	shiftMonth(offset: number): void {
		this.daily.shiftMonth(offset);
	}

	openScoringInfo(event: Event): void {
		event.preventDefault();
		this.challengeInfoId.set(undefined);
		this.scoringInfo.set(true);
	}

	closeScoringInfo(): void {
		this.scoringInfo.set(false);
	}

	openChallengeInfo(id: CHALLENGE_ID, event: Event): void {
		event.preventDefault();
		if (this.devChallengeStart && event instanceof MouseEvent && event.shiftKey) {
			this.startPickedChallenge(id);
			return;
		}
		this.scoringInfo.set(false);
		this.challengeInfoId.set(id);
	}

	onPopupKeydown(event: KeyboardEvent): void {
		event.stopPropagation();
		trapFocus((event.currentTarget as HTMLElement | null), event);
	}

	closeChallengeInfo(): void {
		this.challengeInfoId.set(undefined);
	}

	private startPickedChallenge(id: CHALLENGE_ID): void {
		const entry = this.entry();
		if (entry) {
			this.startEvent.emit({ ...entry, challenge: id });
		}
	}
}
