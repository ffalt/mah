import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { describe, afterEach, beforeEach, it, expect, vi } from 'vitest';
import { GameComponent } from './game-component.component';
import { AppService } from '../../service/app.service';
import { SvgdefService } from '../../service/svgdef.service';
import { DailyService, type DailyEntry } from '../../service/daily.service';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { CHALLENGE_CODES, type CHALLENGE_ID, challengeInfo } from '../../model/challenge/consts';
import type { Layout, Mapping } from '../../model/types';

function stackedMapping(): Mapping {
	const mapping: Mapping = [];
	for (let z = 0; z < 2; z++) {
		for (let y = 0; y < 8; y += 2) {
			for (let x = 0; x < 12; x += 2) {
				mapping.push([z, x, y]);
			}
		}
	}
	return mapping;
}

function layout(): Layout {
	return { id: 'daily-board', name: 'Daily Board', category: 'Test', mapping: stackedMapping() };
}

function entryFor(challenge: CHALLENGE_ID): DailyEntry {
	return {
		dayKey: '2026-07-30',
		seed: 'daily-2026-07-30',
		challenge,
		layout: layout(),
		generated: false
	};
}

// end-to-end through the real GameComponent: open the dialog, start the day, play it, record the result
describe('GameComponent daily challenge flow', () => {
	let component: GameComponent;
	let fixture: ComponentFixture<GameComponent>;
	let app: AppService;
	let daily: DailyService;

	function detectChanges(): void {
		fixture.changeDetectorRef.markForCheck();
		fixture.detectChanges();
	}

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [GameComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), SvgdefService, AppService, DailyService]
		}).compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GameComponent);
		component = fixture.componentInstance;
		app = TestBed.inject(AppService);
		daily = TestBed.inject(DailyService);
		vi.spyOn(daily, 'now').mockReturnValue(new Date(2026, 6, 30));
		vi.spyOn(daily, 'getResult').mockReturnValue(undefined);
		vi.spyOn(TestBed.inject(LayoutService), 'getPreview').mockReturnValue('preview');
		app.settings.tutorialCompleted.set(true);
		// jsdom has no canvas, and winning a challenge would fire the confetti animation
		app.settings.confetti.set(false);
		fixture.detectChanges();
	});

	// a challenge starts the clock, so every test would otherwise leave a 1s timer chain running
	afterEach(() => {
		fixture.destroy();
		app.game.destroy();
	});

	it('reuses the board picker dialog rather than adding a second one', () => {
		component.showDailyChallenge();
		detectChanges();
		expect(component.newgame().visible()).toBe(true);
		expect(component.dailyView()).toBe(true);
		// exactly one dialog is rendered for the picker, showing the daily view
		expect(fixture.debugElement.queryAll(By.css('.overlay-newgame'))).toHaveLength(1);
		expect(fixture.debugElement.query(By.css('app-daily-challenge'))).toBeTruthy();
		expect(fixture.debugElement.query(By.css('app-choose-layout'))).toBeFalsy();
	});

	it('switches from the layout list to the daily view and back', () => {
		component.showNewGame();
		detectChanges();
		expect(component.dailyView()).toBe(false);
		expect(fixture.debugElement.query(By.css('app-choose-layout'))).toBeTruthy();

		component.showDailyChallenge();
		detectChanges();
		expect(component.dailyView()).toBe(true);
		expect(fixture.debugElement.query(By.css('app-daily-challenge'))).toBeTruthy();
		expect(fixture.debugElement.query(By.css('app-choose-layout'))).toBeFalsy();

		component.showLayoutList();
		detectChanges();
		expect(component.dailyView()).toBe(false);
		expect(fixture.debugElement.query(By.css('app-choose-layout'))).toBeTruthy();
		expect(fixture.debugElement.query(By.css('app-daily-challenge'))).toBeFalsy();
		// the dialog never closed while switching
		expect(component.newgame().visible()).toBe(true);
	});

	it('switches back to the board list from the tabs', () => {
		component.showDailyChallenge();
		detectChanges();
		fixture.debugElement.queryAll(By.css('.newgame-tab'))[0].nativeElement.click();
		detectChanges();
		expect(component.dailyView()).toBe(false);
		expect(component.newgame().visible()).toBe(true);
	});

	it('switches to the daily view from the tabs', () => {
		component.showNewGame();
		detectChanges();
		fixture.debugElement.queryAll(By.css('.newgame-tab'))[1].nativeElement.click();
		detectChanges();
		expect(component.dailyView()).toBe(true);
	});

	it('opens the picker on the daily view from the keyboard shortcut', () => {
		expect(component.newgame().visible()).toBe(false);
		expect(component.handleKeyDownEventKey('d')).toBe(true);
		expect(component.newgame().visible()).toBe(true);
		expect(component.dailyView()).toBe(true);
	});

	it('keeps the daily view open when the shortcut repeats', () => {
		component.handleKeyDownEventKey('d');
		detectChanges();
		component.handleKeyDownEventKey('d');
		detectChanges();
		// an open dialog swallows keydown before it reaches the document listener, so this is
		// unreachable in a browser; assert it is at least idempotent rather than destructive
		expect(component.newgame().visible()).toBe(true);
		expect(component.dailyView()).toBe(true);
	});

	it('steps escape back to the layout list before closing', () => {
		component.showDailyChallenge();
		detectChanges();
		// first escape returns to the list
		expect(component.handleKeyDownDialogExit()).toBe(true);
		expect(component.dailyView()).toBe(false);
		expect(component.newgame().visible()).toBe(true);
		// second escape closes the dialog
		expect(component.handleKeyDownDialogExit()).toBe(true);
		expect(component.newgame().visible()).toBe(false);
	});

	it('reopens on the layout list after the daily view was closed', () => {
		component.showDailyChallenge();
		detectChanges();
		component.newgame().toggle();
		detectChanges();
		expect(component.dailyView()).toBe(false);
		component.showNewGame();
		detectChanges();
		expect(component.dailyView()).toBe(false);
		expect(fixture.debugElement.query(By.css('app-choose-layout'))).toBeTruthy();
	});

	it('starts the challenge, marks the board and renders the hud', () => {
		component.showDailyChallenge();
		detectChanges();
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		detectChanges();

		const challenge = app.game.challenge();
		expect(challenge?.id).toBe(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		expect(challenge?.dayKey).toBe('2026-07-30');
		expect(challenge?.markedStones('midas')).toHaveLength(1);
		expect(app.game.isRunning()).toBe(true);
		expect(component.newgame().visible()).toBe(false);
		expect(component.dailyView()).toBe(false);
		expect(fixture.debugElement.query(By.css('app-challenge-hud'))).toBeTruthy();
	});

	// closing the picker by hand skips its toggle event, so the mirrored dialog state has to be cleared with it
	it('clears the mirrored dialog state when the challenge starts', () => {
		component.showDailyChallenge();
		detectChanges();
		expect(component.anyDialogVisible()).toBe(true);
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		detectChanges();
		expect(component.anyDialogVisible()).toBe(false);
		// with the flag left stale the start screen would stay hidden once the board goes idle again
		app.game.reset();
		detectChanges();
		expect(component.showStartScreen()).toBe(true);
	});

	it('pauses a timed challenge when a dialog opens, and conceals the board with it', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_SPARKSTONE));
		detectChanges();
		component.help().toggle();
		detectChanges();
		expect(component.anyDialogVisible()).toBe(true);
		expect(app.game.isPaused()).toBe(true);
		expect(component.concealed()).toBe(true);
	});

	it('pauses a timed challenge when the new game picker opens', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_RUNNING_SAND));
		detectChanges();
		component.newGame();
		detectChanges();
		expect(app.game.isPaused()).toBe(true);
		expect(component.concealed()).toBe(true);
	});

	it('still pauses an untimed challenge when a dialog opens, but leaves the board readable', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		detectChanges();
		component.help().toggle();
		detectChanges();
		expect(app.game.isPaused()).toBe(true);
		// nothing to cheat at without a countdown, so the faces stay
		expect(component.concealed()).toBe(false);
	});

	it('cannot lose a timed challenge while a dialog holds the clock', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));
		detectChanges();
		component.help().toggle();
		detectChanges();
		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
		// the clock callback a paused game ignores - the run must not end behind a dialog the player cannot see past
		app.game.clock.onStep?.();
		expect(app.game.message()?.messageID).toBe('MSG_CONTINUE_PAUSE');
	});

	it('lets the player pause a timed challenge, and conceals the board while they do', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));
		detectChanges();

		app.game.toggle();
		detectChanges();

		expect(app.game.isPaused()).toBe(true);
		expect(component.concealed()).toBe(true);

		app.game.toggle();
		detectChanges();

		expect(app.game.isRunning()).toBe(true);
		expect(component.concealed()).toBe(false);
	});

	it('reveals the board again when the dialog closes and the countdown resumes', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_SPARKSTONE));
		detectChanges();
		component.help().toggle();
		detectChanges();
		component.help().toggle();
		detectChanges();
		expect(app.game.isRunning()).toBe(true);
		expect(component.concealed()).toBe(false);
	});

	it('tints the marked tile', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		detectChanges();
		const marked = fixture.debugElement.queryAll(By.css('g[data-mark="midas"]'));
		expect(marked).toHaveLength(1);
		expect(marked[0].query(By.css('.mark-tint-fill'))).toBeTruthy();
		expect(marked[0].query(By.css('.mark-aura'))).toBeFalsy();
	});

	it('draws the sparkstone aura behind the stone', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_SPARKSTONE));
		detectChanges();
		const marked = fixture.debugElement.queryAll(By.css('g[data-mark="spark"]'));
		expect(marked).toHaveLength(1);
		// the aura has to come before the tile group - drawn after, the glow would sit on the tile art
		const children = [...(marked[0].nativeElement as SVGGElement).children].map(child => child.getAttribute('class'));
		expect(children[0]).toBe('mark-aura');
		expect(children[1]).toBe('tile');
	});

	it('keeps the hud in zen mode', () => {
		// five of the seven challenges are timed, so hiding the countdown would lose the run without warning
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_SPARKSTONE));
		detectChanges();
		expect(fixture.debugElement.query(By.css('app-challenge-hud'))).toBeTruthy();
		component.toggleZenMode();
		detectChanges();
		expect(fixture.debugElement.query(By.css('app-challenge-hud'))).toBeTruthy();
		expect(fixture.debugElement.query(By.css('app-challenge-hud .challenge-time'))).toBeTruthy();
	});

	it('shows no hud in zen mode for an ordinary game', () => {
		component.startGame({ layout: layout(), buildMode: 'MODE_SOLVABLE', gameMode: 'GAME_MODE_STANDARD' });
		component.toggleZenMode();
		detectChanges();
		expect(fixture.debugElement.query(By.css('app-challenge-hud'))).toBeFalsy();
	});

	it('builds the identical board for the same day', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		const first = app.game.board.save();
		const midasFirst = app.game.challenge()!.markedStones('midas')[0];
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		const second = app.game.board.save();
		const midasSecond = app.game.challenge()!.markedStones('midas')[0];
		expect(second).toEqual(first);
		expect([midasSecond.z, midasSecond.x, midasSecond.y]).toEqual([midasFirst.z, midasFirst.x, midasFirst.y]);
	});

	it('records a win against the day', () => {
		const record = vi.spyOn(daily, 'record');
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		const challenge = app.game.challenge()!;
		for (const stone of challenge.markedStones('midas')) {
			stone.picked.set(true);
		}
		app.game.checkGameState();
		expect(record).toHaveBeenCalledTimes(1);
		expect(record.mock.calls[0][0]).toBe('2026-07-30');
		expect(record.mock.calls[0][1]).toBe(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		expect(record.mock.calls[0][2]).toBe(true);
	});

	it('records a loss when the countdown expires', () => {
		const record = vi.spyOn(daily, 'record');
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));
		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
		app.game.checkGameState();
		expect(record).toHaveBeenCalledTimes(1);
		expect(record.mock.calls[0][2]).toBe(false);
	});

	it('announces a countdown that runs out, which no click reports', () => {
		vi.useFakeTimers();
		try {
			component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));
			detectChanges();
			app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
			// the clock's own callback, the one path that ends a run without the player touching the board
			app.game.clock.onStep?.();
			detectChanges();
			vi.advanceTimersByTime(100);

			expect(app.game.message()?.messageID).toBe('MSG_TIME_UP');
			expect(component.announceText()).toBe('MSG_TIME_UP');
		} finally {
			vi.useRealTimers();
		}
	});

	it('announces a challenge lost on a deadlock rather than the clock', () => {
		vi.useFakeTimers();
		try {
			component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_BLACKOUT));
			detectChanges();
			// no free pair left, and a challenge gets no rescue shuffle
			vi.spyOn(app.game.board, 'free').mockReturnValue([]);
			app.game.checkGameState();
			detectChanges();
			vi.advanceTimersByTime(100);

			expect(app.game.message()?.messageID).toBe('MSG_CHALLENGE_LOST');
			expect(component.announceText()).toBe('MSG_CHALLENGE_LOST');
		} finally {
			vi.useRealTimers();
		}
	});

	it('records a loss when the run is restarted from the daily dialog', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));
		const record = vi.spyOn(daily, 'record');

		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));

		expect(record).toHaveBeenCalledTimes(1);
		expect(record.mock.calls[0][0]).toBe('2026-07-30');
		expect(record.mock.calls[0][2]).toBe(false);
	});

	it('records a loss when another board is picked mid-run', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_SPARKSTONE));
		const record = vi.spyOn(daily, 'record');

		component.startGame({ layout: layout(), buildMode: app.game.board.buildMode, gameMode: app.game.mode() });

		expect(record).toHaveBeenCalledTimes(1);
		expect(record.mock.calls[0][1]).toBe(CHALLENGE_CODES.CHALLENGE_SPARKSTONE);
		expect(record.mock.calls[0][2]).toBe(false);
		expect(app.game.challenge()).toBeUndefined();
	});

	it('carries the earned score into the end message', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		const challenge = app.game.challenge()!;
		challenge.score.addBonus(750);
		for (const stone of challenge.markedStones('midas')) {
			stone.picked.set(true);
		}
		app.game.checkGameState();
		expect(app.game.message()?.messageID).toBe('MSG_CHALLENGE_WON');
		expect(app.game.message()?.score).toBe(challenge.score.points());
	});

	it('flags a new best score on the end message', () => {
		vi.spyOn(daily, 'record').mockReturnValue(true);
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		for (const stone of app.game.challenge()!.markedStones('midas')) {
			stone.picked.set(true);
		}
		app.game.checkGameState();
		expect(app.game.message()?.scoreBest).toBe(true);
	});

	it('leaves the end message unflagged when the score was beaten before', () => {
		vi.spyOn(daily, 'record').mockReturnValue(false);
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE));
		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1);
		app.game.checkGameState();
		expect(app.game.message()?.messageID).toBe('MSG_TIME_UP');
		expect(app.game.message()?.score).toBe(0);
		expect(app.game.message()?.scoreBest).toBeUndefined();
	});

	it('does not record anything for an ordinary game', () => {
		const record = vi.spyOn(daily, 'record');
		component.startGame({ layout: layout(), buildMode: 'MODE_SOLVABLE', gameMode: 'GAME_MODE_STANDARD' });
		for (const stone of app.game.board.stones()) {
			stone.picked.set(true);
		}
		app.game.board.update();
		app.game.checkGameState();
		expect(record).not.toHaveBeenCalled();
	});

	it('leaves the board picker on the settings the player chose', () => {
		component.startGame({ layout: layout(), buildMode: 'MODE_RANDOM', gameMode: 'GAME_MODE_EXPERT' });
		// a daily run is always solvable and plays by the challenge rules, and used to write both back onto the picker
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		expect(app.game.ruleMode()).toBe('GAME_MODE_CHALLENGE');
		expect(app.game.mode()).toBe('GAME_MODE_EXPERT');
		expect(component.pickerGameMode()).toBe('GAME_MODE_EXPERT');
		expect(component.pickerBuildMode()).toBe('MODE_RANDOM');

		component.showNewGame();
		detectChanges();
		const picker = fixture.debugElement.query(By.css('app-choose-layout'));
		expect(picker.componentInstance.gameMode()).toBe('GAME_MODE_EXPERT');
		expect(picker.componentInstance.buildMode()).toBe('MODE_RANDOM');
	});

	it('banks a run the calendar rolled past and tells the player', () => {
		const record = vi.spyOn(daily, 'record');
		const storage = TestBed.inject(LocalstorageService);
		storage.storeState({
			stones: [[0, 0, 0, 0]],
			undo: [],
			elapsed: 42_000,
			state: 1,
			layout: 'daily-board',
			gameMode: 'GAME_MODE_STANDARD',
			buildMode: 'MODE_SOLVABLE',
			challenge: { code: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'daily-2026-07-30', dayKey: '2026-07-30', score: 900 }
		});
		app.game.now = () => new Date(2026, 6, 31);
		// AppService already called init() before this component existed, so replay it now that it can listen
		app.game.init();

		expect(app.game.expireStaleDaily()).toBe(true);

		expect(record).toHaveBeenCalledTimes(1);
		expect(record.mock.calls[0][0]).toBe('2026-07-30');
		expect(record.mock.calls[0][2]).toBe(false);
		expect(record.mock.calls[0][4]).toBe(900);
		expect(app.game.message()?.messageID).toBe('MSG_DAILY_EXPIRED');
		storage.storeState();
	});

	it('drops the challenge when an ordinary game starts afterwards', () => {
		component.startDailyChallenge(entryFor(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH));
		expect(app.game.challenge()).toBeDefined();
		component.startGame({ layout: layout(), buildMode: 'MODE_SOLVABLE', gameMode: 'GAME_MODE_STANDARD' });
		detectChanges();
		expect(app.game.challenge()).toBeUndefined();
		expect(fixture.debugElement.query(By.css('app-challenge-hud'))).toBeFalsy();
		expect(app.game.board.stones().every(stone => stone.mark() === undefined)).toBe(true);
	});
});
