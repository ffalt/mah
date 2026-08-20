import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { describe, beforeEach, it, expect } from 'vitest';
import { ChallengeHudComponent } from './challenge-hud.component';
import { AppService } from '../../service/app.service';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { MODE_SOLVABLE } from '../../model/builder';
import { GAME_MODE_STANDARD } from '../../model/consts';
import {
	CHALLENGE_CODES,
	challengeInfo
} from '../../model/challenge/consts';
import type { Layout, Mapping } from '../../model/types';

function mapping(): Mapping {
	const places: Mapping = [];
	for (let z = 0; z < 2; z++) {
		for (let y = 0; y < 6; y += 2) {
			for (let x = 0; x < 8; x += 2) {
				places.push([z, x, y]);
			}
		}
	}
	return places;
}

function layout(): Layout {
	return { id: 'hud-test', name: 'Hud Test', category: 'Test', mapping: mapping() };
}

describe('ChallengeHudComponent', () => {
	let component: ChallengeHudComponent;
	let fixture: ComponentFixture<ChallengeHudComponent>;
	let app: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ChallengeHudComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService, LayoutService, LocalstorageService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ChallengeHudComponent);
		component = fixture.componentInstance;
		app = TestBed.inject(AppService);
		fixture.detectChanges();
	});

	it('creates', () => {
		expect(component).toBeTruthy();
	});

	it('renders nothing without an active challenge', () => {
		app.game.reset();
		fixture.detectChanges();
		expect(component.challenge()).toBeUndefined();
		expect(fixture.nativeElement.textContent.trim()).toBe('');
	});

	it('reports no time limit for the Midas tile challenge', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		fixture.detectChanges();
		expect(component.hasTimeLimit()).toBe(false);
		expect(component.objective()).toBe('midas');
	});

	it('formats the countdown as minutes and seconds', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		const limit = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0;
		expect(component.remainingLabel()).toBe('03:00');
		app.game.clock.elapsed.set(limit - 65_000);
		expect(component.remainingLabel()).toBe('01:05');
	});

	it('renders zero rather than a dash when the countdown is spent', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 5000);
		expect(component.remaining()).toBe(0);
		expect(component.remainingLabel()).toBe('00:00');
	});

	it('flags a low countdown', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		expect(component.lowTime()).toBe(false);
		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) - 10_000);
		expect(component.lowTime()).toBe(true);
	});

	it('holds each time warning until the next threshold, rather than speaking every second', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		const limit = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0;
		expect(component.timeWarning()).toBe('');

		app.game.clock.elapsed.set(limit - 30_000);
		expect(component.timeWarning()).toBe('00:30');
		// a second of the same warning must not re-trigger the live region
		app.game.clock.elapsed.set(limit - 29_000);
		expect(component.timeWarning()).toBe('00:30');

		app.game.clock.elapsed.set(limit - 10_000);
		expect(component.timeWarning()).toBe('00:10');
	});

	it('drops the time warning once the countdown is spent', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) + 1000);
		expect(component.timeWarning()).toBe('');
	});

	it('stays quiet for a challenge without a countdown', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH, seed: 'seed' });
		app.game.clock.elapsed.set(10_000_000);
		expect(component.timeWarning()).toBe('');
	});

	it('keeps the live region in the dom before it has anything to say', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		fixture.detectChanges();
		// a region added to the dom with its text already in it is not reliably announced
		const region = fixture.nativeElement.querySelector('[aria-live]') as HTMLElement;
		expect(region).toBeTruthy();
		expect(region.textContent?.trim()).toBe('');

		app.game.clock.elapsed.set((challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).timeLimit ?? 0) - 30_000);
		fixture.detectChanges();
		expect(region.textContent).toContain('00:30');
	});

	it('computes the progress percentage', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE, seed: 'seed' });
		const challenge = app.game.challenge()!;
		expect(component.percent()).toBe(0);
		const target = challengeInfo(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE).matchTarget ?? 30;
		for (let index = 0; index < target / 2; index++) {
			challenge.score.addMatch(index * 10_000, 0);
		}
		challenge.pick(app.game.board.stones()[0], app.game.board.stones()[1]);
		expect(component.percent()).toBeGreaterThan(40);
	});

	it('shows the combo only while a chain is alive', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, seed: 'seed' });
		const challenge = app.game.challenge()!;
		expect(component.comboActive()).toBe(false);
		challenge.score.addMatch(1000, 0);
		challenge.score.addMatch(1500, 0);
		expect(component.comboActive()).toBe(true);
		expect(component.multiplier()).toBe(1.25);
		challenge.score.breakCombo();
		expect(component.comboActive()).toBe(false);
	});

	it('tracks the score', () => {
		app.game.start(layout(), MODE_SOLVABLE, GAME_MODE_STANDARD, { id: CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT, seed: 'seed' });
		const challenge = app.game.challenge()!;
		challenge.score.addBonus(700);
		expect(component.score()).toBe(700);
	});
});
