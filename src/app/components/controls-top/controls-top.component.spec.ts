import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, GAME_MODE_STANDARD } from '../../model/consts';
import type { Place } from '../../model/types';
import { Challenge } from '../../model/challenge/challenge';
import { CHALLENGE_CODES, type CHALLENGE_ID } from '../../model/challenge/consts';
import { ControlsTopComponent } from './controls-top.component';

function startChallenge(appService: AppService, id: CHALLENGE_ID): void {
	const game = appService.game;
	game.challenge.set(new Challenge({ id, seed: 'seed' }, game.board, game.clock));
}

describe('ControlsTopComponent', () => {
	let component: ControlsTopComponent;
	let fixture: ComponentFixture<ControlsTopComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ControlsTopComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ControlsTopComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		appService.game.mode.set(GAME_MODE_EASY);
		fixture.detectChanges();
	});

	function gameButtons(): Array<HTMLButtonElement> {
		return Array.from(fixture.nativeElement.querySelectorAll(':scope .ctrl-game .button'));
	}

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render the buttons matching the game mode', () => {
		expect(fixture.nativeElement.querySelectorAll(':scope .ctrl-game .button')).toHaveLength(5); // pause, shuffle, undo, hint, restart

		appService.game.mode.set(GAME_MODE_STANDARD);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelectorAll(':scope .ctrl-game .button')).toHaveLength(4); // pause, undo, hint, restart

		appService.game.mode.set(GAME_MODE_EXPERT);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelectorAll(':scope .ctrl-game .button')).toHaveLength(2); // pause, restart
	});

	it('should emit events when buttons are clicked', () => {
		appService.game.board.undo.set([[0, 0, 0]] as Array<Place>);
		fixture.detectChanges();

		const helpSpy = vi.fn();
		const shuffleSpy = vi.fn();
		const undoSpy = vi.fn();
		const hintSpy = vi.fn();
		const newGameSpy = vi.fn();
		component.helpEvent.subscribe(helpSpy);
		component.shuffleEvent.subscribe(shuffleSpy);
		component.undoEvent.subscribe(undoSpy);
		component.hintEvent.subscribe(hintSpy);
		component.newGameEvent.subscribe(newGameSpy);

		(fixture.nativeElement.querySelector(':scope .ctrl-name .button') as HTMLElement).click();
		expect(helpSpy).toHaveBeenCalled();

		const buttons = gameButtons(); // easy mode: pause, shuffle, undo, hint, restart
		buttons[1].click();
		expect(shuffleSpy).toHaveBeenCalled();

		buttons[2].click();
		expect(undoSpy).toHaveBeenCalled();

		buttons[3].click();
		expect(hintSpy).toHaveBeenCalled();

		buttons[4].click();
		expect(newGameSpy).toHaveBeenCalled();
	});

	it('should toggle the game when the pause button is clicked', () => {
		const toggleSpy = vi.spyOn(appService.game, 'toggle').mockImplementation(vi.fn());

		gameButtons()[0].click();

		expect(toggleSpy).toHaveBeenCalled();
	});

	it('should hide the undo button for a challenge that forbids undo', () => {
		appService.game.mode.set(GAME_MODE_STANDARD);
		fixture.detectChanges();
		expect(gameButtons()).toHaveLength(4); // pause, undo, hint, restart

		// Blackout forbids undo and has no countdown, so only the undo button goes
		startChallenge(appService, CHALLENGE_CODES.CHALLENGE_BLACKOUT);
		fixture.detectChanges();
		expect(gameButtons()).toHaveLength(3); // pause, hint, restart
	});

	it('should keep the pause button for a timed challenge, which pausing conceals the board for', () => {
		appService.game.mode.set(GAME_MODE_STANDARD);
		fixture.detectChanges();

		// Match Attack has a countdown and forbids undo
		startChallenge(appService, CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE);
		fixture.detectChanges();

		expect(gameButtons()).toHaveLength(3); // pause, hint, restart
		expect(fixture.nativeElement.querySelector('app-icon-pause')).toBeTruthy();
	});

	it('should hide shuffle for a challenge, even one that allows everything else', () => {
		// the picker was left on easy mode, which is the only mode that offers shuffle
		expect(gameButtons()).toHaveLength(5); // pause, shuffle, undo, hint, restart

		startChallenge(appService, CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH);
		fixture.detectChanges();

		expect(gameButtons()).toHaveLength(4); // pause, undo, hint, restart
	});

	it('should disable the undo button when there is nothing to undo', () => {
		appService.game.board.undo.set([]);
		fixture.detectChanges();
		expect(gameButtons()[2].disabled).toBe(true);

		appService.game.board.undo.set([[0, 0, 0]] as Array<Place>);
		fixture.detectChanges();
		expect(gameButtons()[2].disabled).toBe(false);
	});
});
