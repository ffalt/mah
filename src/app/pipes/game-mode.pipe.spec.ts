import { GameModeEasyPipe, GameModeStandardPipe } from './game-mode.pipe';
import { GAME_MODE_EASY, GAME_MODE_STANDARD, GAME_MODE_EXPERT } from '../model/consts';

describe('GameModeEasyPipe', () => {
	it('create an instance', () => {
		const pipe = new GameModeEasyPipe();
		expect(pipe).toBeTruthy();
	});

	it('checks if game mode is easy', () => {
		const pipe = new GameModeEasyPipe();
		expect(pipe.transform(GAME_MODE_EASY)).toBe(true);
		expect(pipe.transform(GAME_MODE_STANDARD)).toBe(false);
		expect(pipe.transform(GAME_MODE_EXPERT)).toBe(false);
		expect(pipe.transform(undefined)).toBe(false);
		expect(pipe.transform('INVALID_MODE')).toBe(false);
	});
});

describe('GameModeStandardPipe', () => {
	it('create an instance', () => {
		const pipe = new GameModeStandardPipe();
		expect(pipe).toBeTruthy();
	});

	it('checks if game mode is easy or standard', () => {
		const pipe = new GameModeStandardPipe();
		expect(pipe.transform(GAME_MODE_EASY)).toBe(true);
		expect(pipe.transform(GAME_MODE_STANDARD)).toBe(true);
		expect(pipe.transform(GAME_MODE_EXPERT)).toBe(false);
		expect(pipe.transform(undefined)).toBe(false);
		expect(pipe.transform('INVALID_MODE')).toBe(false);
	});
});
