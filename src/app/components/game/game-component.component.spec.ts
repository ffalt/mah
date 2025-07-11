import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { AppService } from '../../service/app.service';
import { SvgdefService } from '../../service/svgdef.service';
import { CoreModule } from '../../modules/core/core.module';
import { GameComponent } from './game-component.component';
import { By } from '@angular/platform-browser';
import { WorkerService } from '../../service/worker.service';
import { GAME_MODE_EASY } from '../../model/consts';
import { BUILD_MODE_ID, MODE_SOLVABLE } from '../../model/builder';
import { environment } from '../../../environments/environment';
import { Stone } from '../../model/stone';

describe('GameComponent', () => {
	let component: GameComponent;
	let fixture: ComponentFixture<GameComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [
				GameComponent
			],
			imports: [CoreModule, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), SvgdefService, AppService, WorkerService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GameComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
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
		const helpSpy = jest.spyOn(component.help(), 'toggle');
		const infoSpy = jest.spyOn(component.info(), 'toggle');
		const settingsSpy = jest.spyOn(component.settings(), 'toggle');
		const hintSpy = jest.spyOn(component.game, 'hint');
		const shuffleSpy = jest.spyOn(component.game, 'shuffle');
		const backSpy = jest.spyOn(component.game, 'back');
		const pauseSpy = jest.spyOn(component.game, 'pause');
		const resumeSpy = jest.spyOn(component.game, 'resume');
		const isRunningSpy = jest.spyOn(component.game, 'isRunning').mockReturnValue(true);
		const isPausedSpy = jest.spyOn(component.game, 'isPaused').mockReturnValue(false);

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
		const helpSpy = jest.spyOn(helpDialog, 'toggle');

		// Initialize the visible model to true
		helpDialog.visible.set(true);

		// Test Escape key with help dialog open
		const result = component.handleKeyDownDialogExit();
		expect(result).toBe(true);
		expect(helpSpy).toHaveBeenCalled();

		// Reset and test with no dialogs open
		helpDialog.visible.set(false);
		const noDialogResult = component.handleKeyDownDialogExit();
		expect(noDialogResult).toBe(false);
	});

	it('should handle stone clicks', () => {
		const clickSpy = jest.spyOn(component.game, 'click');
		const soundPlaySpy = jest.spyOn(component.game.sound, 'play')
			.mockImplementation(jest.fn);
		const stone = new Stone(0, 0, 0, 0, 0);

		component.stoneClick(stone);
		expect(clickSpy).toHaveBeenCalledWith(stone);
		expect(soundPlaySpy).toHaveBeenCalled();
	});

	it('should toggle game state when dialog state changes', () => {
		const pauseSpy = jest.spyOn(component.game, 'pause');
		const resumeSpy = jest.spyOn(component.game, 'resume');
		const isPausedSpy = jest.spyOn(component.game, 'isPaused').mockReturnValue(false);
		const saveSpy = jest.spyOn(appService.settings, 'save');

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
		const resumeSpy = jest.spyOn(component.game, 'resume');
		const resetSpy = jest.spyOn(component.game, 'reset');
		const isPausedSpy = jest.spyOn(component.game, 'isPaused').mockReturnValue(true);
		const showNewGameSpy = jest.spyOn(component, 'showNewGame');

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
		const pauseSpy = jest.spyOn(component.game, 'pause');
		const showNewGameSpy = jest.spyOn(component, 'showNewGame');

		component.newGame();
		expect(pauseSpy).toHaveBeenCalled();
		expect(showNewGameSpy).toHaveBeenCalled();
	});

	it('should start game with provided data', () => {
		const resetSpy = jest.spyOn(component.game, 'reset');
		const startSpy = jest.spyOn(component.game, 'start');
		const visibleSetSpy = jest.spyOn(component.newgame().visible, 'set');

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

	it('should render control buttons', () => {
		const pauseButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(1)'));
		const shuffleButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(2)'));
		const undoButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(3)'));
		const hintButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(4)'));
		const restartButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(5)'));

		expect(pauseButton).toBeTruthy();
		expect(shuffleButton).toBeTruthy();
		expect(undoButton).toBeTruthy();
		expect(hintButton).toBeTruthy();
		expect(restartButton).toBeTruthy();
	});

	it('should call game functions when control buttons are clicked', () => {
		const toggleSpy = jest.spyOn(component.game, 'toggle');
		const shuffleSpy = jest.spyOn(component.game, 'shuffle');
		const hintSpy = jest.spyOn(component.game, 'hint');
		const newGameSpy = jest.spyOn(component, 'newGame');

		const pauseButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(1)')).nativeElement;
		const hintButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(4)')).nativeElement;
		const restartButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(5)')).nativeElement;
		const shuffleButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(2)')).nativeElement;

		pauseButton.click();
		expect(toggleSpy).toHaveBeenCalled();

		shuffleButton.click();
		expect(shuffleSpy).toHaveBeenCalled();

		hintButton.click();
		expect(hintSpy).toHaveBeenCalled();

		restartButton.click();
		expect(newGameSpy).toHaveBeenCalled();
	});

	it('should call back function when control buttons are clicked', () => {
		// Mock the game state to enable the undo button
		const mockBoard = {
			...component.game.board,
			undo: [1, 2, 3] // Non-empty undo array to enable the button
		};
		Object.defineProperty(component.game, 'board', { value: mockBoard });

		// Force change detection to update the button state
		fixture.detectChanges();

		const undoButton = fixture.debugElement.query(By.css('.ctrl-game button:nth-child(3)')).nativeElement;
		const backSpy = jest.spyOn(component.game, 'back');

		undoButton.click();
		expect(backSpy).toHaveBeenCalled();
	});

	it('should check fullscreen capability', () => {
		// Spy on the component's method
		const isFullscreenEnabledSpy = jest.spyOn(component, 'isFullscreenEnabled');

		// Test with fullscreen enabled
		isFullscreenEnabledSpy.mockReturnValue(true);
		expect(component.canFullscreen()).toBe(!environment.mobile);

		// Test with fullscreen disabled
		isFullscreenEnabledSpy.mockReturnValue(false);
		expect(component.canFullscreen()).toBe(false);
	});

	it('should handle fullscreen toggle', () => {
		// Spy on the component's methods
		const isFullscreenSpy = jest.spyOn(component, 'isFullscreen').mockReturnValue(true);
		const exitFullscreenSpy = jest.spyOn(component, 'exitFullscreen').mockImplementation(jest.fn());
		const requestFullscreenSpy = jest.spyOn(component, 'requestFullscreen').mockImplementation(jest.fn());

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
		const handleKeyDownDialogExitSpy = jest.spyOn(component, 'handleKeyDownDialogExit').mockReturnValue(true);
		const handleKeyDownEventKeySpy = jest.spyOn(component, 'handleKeyDownEventKey');

		// Create mock event
		const event = new KeyboardEvent('keydown', { key: 'Escape' });

		// Call method
		component.handleKeyDownEvent(event);

		// Verify dialog exit was checked
		expect(handleKeyDownDialogExitSpy).toHaveBeenCalled();
		expect(handleKeyDownEventKeySpy).not.toHaveBeenCalled();
	});

	it('should ignore key events from input elements', () => {
		const handleKeyDownEventKeySpy = jest.spyOn(component, 'handleKeyDownEventKey');

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
