import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, GAME_MODE_STANDARD } from '../../model/consts';
import type { Place } from '../../model/types';
import { ControlsTopComponent } from './controls-top.component';

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
		fixture.componentRef.setInput('gameMode', GAME_MODE_EASY);
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

		fixture.componentRef.setInput('gameMode', GAME_MODE_STANDARD);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelectorAll(':scope .ctrl-game .button')).toHaveLength(4); // pause, undo, hint, restart

		fixture.componentRef.setInput('gameMode', GAME_MODE_EXPERT);
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

	it('should disable the undo button when there is nothing to undo', () => {
		appService.game.board.undo.set([]);
		fixture.detectChanges();
		expect(gameButtons()[2].disabled).toBe(true);

		appService.game.board.undo.set([[0, 0, 0]] as Array<Place>);
		fixture.detectChanges();
		expect(gameButtons()[2].disabled).toBe(false);
	});
});
