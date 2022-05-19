import {Pipe, PipeTransform} from '@angular/core';
import {GAME_MODE_EASY, GAME_MODE_STANDARD} from '../../../model/consts';

@Pipe({
	name: 'gameModeEasy'
})
export class GameModeEasyPipe implements PipeTransform {
	transform(value: string | undefined): boolean {
		return value === GAME_MODE_EASY;
	}
}

@Pipe({
	name: 'gameModeStandard'
})
export class GameModeStandardPipe implements PipeTransform {
	transform(value: string | undefined): boolean {
		return (value === GAME_MODE_EASY) || (value === GAME_MODE_STANDARD);
	}
}
