import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { AppService } from '../../service/app.service';
import { SvgdefService } from '../../service/svgdef.service';
import { GameComponent } from './game-component.component';
import { By } from '@angular/platform-browser';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, GAME_MODE_STANDARD } from '../../model/consts';
import { type BUILD_MODE_ID, MODE_SOLVABLE } from '../../model/builder';
import { environment } from '../../../environments/environment';
import { Stone } from '../../model/stone';
import type { Place } from '../../model/types';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('GameComponent', () => {
	let component: GameComponent;
	let fixture: ComponentFixture<GameComponent>;
	let appService: AppService;

	// mutating plain component/game fields does not mark the view dirty under
	// zoneless change detection, so mark it explicitly before running CD
	function detectChanges(): void {
		fixture.changeDetectorRef.markForCheck();
		fixture.detectChanges();
	}

	function overrideBoardWithUndo(): void {
		component.game.board.undo.set([[0, 0, 0], [0, 0, 0]] as Array<Place>);
		vi.spyOn(component.game.board, 'reset').mockImplementation(vi.fn());
		vi.spyOn(component.game.board, 'clearMatches').mockImplementation(vi.fn());
	}

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [GameComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), SvgdefService, AppService]
		}).compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GameComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		appService.settings.tutorialCompleted.set(true);
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	it('should initialize with correct values', () => {
		expect(component.game).toBe(appService.game);
		expect(component.title).toBe(`${appService.name} v${environment.version}`);
	});

	it('should handle key events', () => {
		// Spy on methods that should be called
		const helpSpy = vi.spyOn(component.help(), 'toggle');
		const infoSpy = vi.spyOn(component.info(), 'toggle');
		const settingsSpy = vi.spyOn(component.settings(), 'toggle');
		const hintSpy = vi.spyOn(component.game, 'hint');
		const shuffleSpy = vi.spyOn(component.game, 'shuffle');
		const backSpy = vi.spyOn(component.game, 'back');
		const pauseSpy = vi.spyOn(component.game, 'pause');
		const resumeSpy = vi.spyOn(component.game, 'resume');
		const isRunningSpy = vi.spyOn(component.game, 'isRunning').mockReturnValue(true);
		const isPausedSpy = vi.spyOn(component.game, 'isPaused').mockReturnValue(false);

		// Test different key handlers
		component.handleKeyDownEventKey('h');
		expect(helpSpy).toHaveBeenCalled();

		component.handleKeyDownEventKey('i');
		expect(infoSpy).toHaveBeenCalled();

		component.handleKeyDownEventKey('s');
		expect(settingsSpy).toHaveBeenCalled();

		component.handleKeyDownEventKey('t');
		expect(hintSpy).toHaveBeenCalled();

		component.handleKeyDownEventKey('m');
		expect(shuffleSpy).toHaveBeenCalled();

		component.handleKeyDownEventKey('u');
		expect(backSpy).toHaveBeenCalled();

		component.handleKeyDownEventKey('p');
		expect(pauseSpy).toHaveBeenCalled();

		// Test pause/resume toggle
		isRunningSpy.mockReturnValue(false);
		isPausedSpy.mockReturnValue(true);
		component.handleKeyDownEventKey('p');
		expect(resumeSpy).toHaveBeenCalled();
	});

	it('should handle dialog exit with Escape key', () => {
		// Spy on dialog toggle methods
		const helpDialog = component.help();
		const helpSpy = vi.spyOn(helpDialog, 'toggle');

		// Initialize the visible model to true
		helpDialog.visible.set(true);

		// Test Escape key with help dialog open
		const result = component.handleKeyDownDialogExit();
		expect(result).toBe(true);
		expect(helpSpy).toHaveBeenCalled();

		// Reset and test with no dialogs open and no game message
		helpDialog.visible.set(false);
		component.game.message.set(undefined);
		const noDialogResult = component.handleKeyDownDialogExit();
		expect(noDialogResult).toBe(false);
	});

	it('should handle stone clicks', () => {
		const clickSpy = vi.spyOn(component.game, 'click');
		const soundPlaySpy = vi.spyOn(component.game.sound, 'play')
			.mockImplementation(vi.fn());
		const stone = new Stone(0, 0, 0, 0, 0);

		component.stoneClick(stone);
		expect(clickSpy).toHaveBeenCalledWith(stone);
		expect(soundPlaySpy).toHaveBeenCalled();
	});

	it('should toggle game state when dialog state changes', () => {
		const pauseSpy = vi.spyOn(component.game, 'pause');
		const resumeSpy = vi.spyOn(component.game, 'resume');
		const isPausedSpy = vi.spyOn(component.game, 'isPaused').mockReturnValue(false);
		const saveSpy = vi.spyOn(appService.settings, 'save');

		// Test dialog opening
		component.toggleDialogState(true);
		expect(pauseSpy).toHaveBeenCalled();

		// Test dialog closing
		isPausedSpy.mockReturnValue(true);
		component.toggleDialogState(false);
		expect(saveSpy).toHaveBeenCalled();
		expect(resumeSpy).toHaveBeenCalled();
	});

	it('should handle message clicks', () => {
		const resumeSpy = vi.spyOn(component.game, 'resume');
		const resetSpy = vi.spyOn(component.game, 'reset');
		const isPausedSpy = vi.spyOn(component.game, 'isPaused').mockReturnValue(true);
		const showNewGameSpy = vi.spyOn(component, 'showNewGame');

		// Test when game is paused
		component.clickMessage();
		expect(resumeSpy).toHaveBeenCalled();

		// Test when game is not paused
		isPausedSpy.mockReturnValue(false);
		component.clickMessage();
		expect(resetSpy).toHaveBeenCalled();
		expect(showNewGameSpy).toHaveBeenCalled();
	});

	it('should start a new game', () => {
		const pauseSpy = vi.spyOn(component.game, 'pause');
		const showNewGameSpy = vi.spyOn(component, 'showNewGame');

		component.newGame();
		expect(pauseSpy).toHaveBeenCalled();
		expect(showNewGameSpy).toHaveBeenCalled();
	});

	it('should start game with provided data', () => {
		const resetSpy = vi.spyOn(component.game, 'reset');
		const startSpy = vi.spyOn(component.game, 'start');
		const visibleSetSpy = vi.spyOn(component.newgame().visible, 'set');

		const gameData = {
			layout: { id: 'test', name: 'Test Layout', category: 'Test', mapping: [] },
			buildMode: MODE_SOLVABLE as BUILD_MODE_ID,
			gameMode: GAME_MODE_EASY
		};

		component.startGame(gameData);
		expect(visibleSetSpy).toHaveBeenCalledWith(false);
		expect(resetSpy).toHaveBeenCalled();
		expect(startSpy).toHaveBeenCalledWith(gameData.layout, gameData.buildMode, gameData.gameMode);
	});

	it('should toggle zen mode', () => {
		component.toggleZenMode();

		expect(component.zenMode()).toBe(true);

		component.toggleZenMode();

		expect(component.zenMode()).toBe(false);
	});

	it('should render the zen mode toggle in the bottom controls', () => {
		const zenToggleButton = fixture.debugElement.query(By.css('.ctrl-stats .menu button[title="ZEN_MODE"]'));

		expect(zenToggleButton).toBeTruthy();
	});

	it('should render control buttons in standard mode', () => {
		component.game.mode.set(GAME_MODE_STANDARD);
		detectChanges();

		const pauseButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(1)'));
		const undoButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(2)'));
		const hintButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(3)'));
		const restartButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(4)'));
		const noFifthButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(5)'));

		expect(pauseButton).toBeTruthy();
		expect(undoButton).toBeTruthy();
		expect(hintButton).toBeTruthy();
		expect(restartButton).toBeTruthy();
		expect(noFifthButton).toBeFalsy();
	});

	it('should call game functions when control buttons in standard mode are clicked', () => {
		component.game.mode.set(GAME_MODE_STANDARD);
		detectChanges();

		const toggleSpy = vi.spyOn(component.game, 'toggle');
		const undoSpy = vi.spyOn(component, 'onUndo');
		const hintSpy = vi.spyOn(component, 'onHint');
		const newGameSpy = vi.spyOn(component, 'newGame');

		fixture.debugElement.query(By.css('.ctrl-game button:nth-child(1)')).nativeElement.click(); // pause
		fixture.debugElement.query(By.css('.ctrl-game button:nth-child(3)')).nativeElement.click(); // hint
		fixture.debugElement.query(By.css('.ctrl-game button:nth-child(4)')).nativeElement.click(); // restart

		expect(toggleSpy).toHaveBeenCalled();
		expect(hintSpy).toHaveBeenCalled();
		expect(newGameSpy).toHaveBeenCalled();

		overrideBoardWithUndo();
		fixture.detectChanges();

		fixture.debugElement.query(By.css('.ctrl-game button:nth-child(2)')).nativeElement.click(); // undo
		expect(undoSpy).toHaveBeenCalled();
	});

	it('should swap menu bars for zen controls when zen mode is enabled', () => {
		component.toggleZenMode();
		detectChanges();

		expect(fixture.debugElement.query(By.css('.controls-top'))).toBeFalsy();
		expect(fixture.debugElement.query(By.css('.controls-bottom'))).toBeFalsy();
		expect(fixture.debugElement.query(By.css('.zen-controls'))).toBeTruthy();
	});

	it('should call important actions from the zen controls', () => {
		component.game.mode.set(GAME_MODE_EASY);
		overrideBoardWithUndo();

		const toggleSpy = vi.spyOn(component.game, 'toggle');
		const hintSpy = vi.spyOn(component, 'onHint').mockImplementation(vi.fn());
		const backSpy = vi.spyOn(component, 'onUndo').mockImplementation(vi.fn());

		component.toggleZenMode();
		detectChanges();

		const zenActionButtons = fixture.debugElement.queryAll(By.css('.zen-controls .button'));
		zenActionButtons[0].nativeElement.click(); // pause
		zenActionButtons[1].nativeElement.click(); // undo
		zenActionButtons[2].nativeElement.click(); // hint
		zenActionButtons[3].nativeElement.click(); // exit zen

		expect(toggleSpy).toHaveBeenCalled();
		expect(backSpy).toHaveBeenCalled();
		expect(hintSpy).toHaveBeenCalled();
		expect(component.zenMode()).toBe(false);
	});

	it('should call important actions from the zen controls in standard mode', () => {
		component.game.mode.set(GAME_MODE_STANDARD);
		overrideBoardWithUndo();

		const toggleSpy = vi.spyOn(component.game, 'toggle');
		const hintSpy = vi.spyOn(component, 'onHint').mockImplementation(vi.fn());
		const backSpy = vi.spyOn(component, 'onUndo').mockImplementation(vi.fn());

		component.toggleZenMode();
		detectChanges();

		const zenButtons = fixture.debugElement.queryAll(By.css('.zen-controls .button'));
		expect(zenButtons).toHaveLength(4); // pause, undo, hint, exit

		zenButtons[0].nativeElement.click(); // pause
		zenButtons[1].nativeElement.click(); // undo
		zenButtons[2].nativeElement.click(); // hint
		zenButtons[3].nativeElement.click(); // exit zen

		expect(toggleSpy).toHaveBeenCalled();
		expect(backSpy).toHaveBeenCalled();
		expect(hintSpy).toHaveBeenCalled();
		expect(component.zenMode()).toBe(false);
	});

	it('should call important actions from the zen controls in expert mode', () => {
		component.game.mode.set(GAME_MODE_EXPERT);

		const toggleSpy = vi.spyOn(component.game, 'toggle');

		component.toggleZenMode();
		detectChanges();

		const zenButtons = fixture.debugElement.queryAll(By.css('.zen-controls .button'));
		expect(zenButtons).toHaveLength(2); // pause, exit only

		zenButtons[0].nativeElement.click(); // pause
		zenButtons[1].nativeElement.click(); // exit zen

		expect(toggleSpy).toHaveBeenCalled();
		expect(component.zenMode()).toBe(false);
	});

	it('should check fullscreen capability', () => {
		// Spy on the component's method
		const isFullscreenEnabledSpy = vi.spyOn(component, 'isFullscreenEnabled');

		// Test with fullscreen enabled
		isFullscreenEnabledSpy.mockReturnValue(true);
		expect(component.canFullscreen()).toBe(!environment.mobile);

		// Test with fullscreen disabled
		isFullscreenEnabledSpy.mockReturnValue(false);
		expect(component.canFullscreen()).toBe(false);
	});

	it('should handle fullscreen toggle', () => {
		// Spy on the component's methods
		const isFullscreenSpy = vi.spyOn(component, 'isFullscreen').mockReturnValue(true);
		const exitFullscreenSpy = vi.spyOn(component, 'exitFullscreen').mockImplementation(vi.fn());
		const requestFullscreenSpy = vi.spyOn(component, 'requestFullscreen').mockImplementation(vi.fn());

		// Test exit fullscreen when already in fullscreen mode
		component.enterFullScreen();
		expect(isFullscreenSpy).toHaveBeenCalled();
		expect(exitFullscreenSpy).toHaveBeenCalled();
		expect(requestFullscreenSpy).not.toHaveBeenCalled();

		// Test enter fullscreen when not in fullscreen mode
		isFullscreenSpy.mockReturnValue(false);
		component.enterFullScreen();
		expect(requestFullscreenSpy).toHaveBeenCalled();
	});

	it('should handle key event with Escape key', () => {
		const handleKeyDownDialogExitSpy = vi.spyOn(component, 'handleKeyDownDialogExit').mockReturnValue(true);
		const handleKeyDownEventKeySpy = vi.spyOn(component, 'handleKeyDownEventKey');

		// Create mock event
		const event = new KeyboardEvent('keydown', { key: 'Escape' });

		// Call method
		component.handleKeyDownEvent(event);

		// Verify dialog exit was checked
		expect(handleKeyDownDialogExitSpy).toHaveBeenCalled();
		expect(handleKeyDownEventKeySpy).not.toHaveBeenCalled();
	});

	it('should ignore key events from input elements', () => {
		const handleKeyDownEventKeySpy = vi.spyOn(component, 'handleKeyDownEventKey');

		// Create mock event with input target
		const mockTarget = document.createElement('input');
		const event = new KeyboardEvent('keydown', { key: 'a' });
		Object.defineProperty(event, 'target', { value: mockTarget });

		// Call method
		component.handleKeyDownEvent(event);

		// Verify key handler was not called
		expect(handleKeyDownEventKeySpy).not.toHaveBeenCalled();
	});
});
