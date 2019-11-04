import {Injectable} from '@angular/core';
import {Game} from '../model/game';
import {Settings} from '../model/settings';
import {LocalstorageService} from './localstorage.service';

@Injectable()
export class AppService {
	name: string = 'Mah Jong';
	game: Game;
	settings: Settings;

	constructor(private storage: LocalstorageService) {
		this.game = new Game(storage);
		this.settings = new Settings(storage);
		this.game.init();
	}

}
