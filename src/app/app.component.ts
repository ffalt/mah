import {Component} from '@angular/core';
import {ImagePreloader} from './model/preloader';
import {Tiles} from './model/tiles';
import {Game} from './model/game';
import {LayoutService} from './service/layout.service';
import {Layouts} from './model/layouts';
import {TranslateService} from 'ng2-translate';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	public game: Game = new Game();
	public layouts: Layouts;
	public loading = true;
	public loaded = '';

	constructor(layouts: LayoutService, translate: TranslateService) {
		translate.setTranslation('en', {
			RESTART: 'Restart',
			UNDO: 'Undo',
			PAUSE: 'Pause',
			HINT: 'Hint',
			STONES: 'Stones',
			FREE: 'Free',
			FULLSCREEN: 'Fullscreen',
			HINT_LONG: 'Show possible moves',
			UNDO_LONG: 'Undo last move',
			RESTART_LONG: 'Start a new game',
			PAUSE_LONG: 'Continue/Pause game',
			MSG_CONTINUE_PAUSE: 'Continue Game...',
			MSG_CONTINUE_SAVE: 'Continue Saved Game...',
			MSG_START: 'Start Game',
			MSG_PLAY_AGAIN: 'Play again',
			MSG_BEST: 'Congratulations, new best time!',
			MSG_GOOD: 'Well done!',
			MSG_FAIL: 'No more matching tiles.',
			STATS_GAMES: 'Nr. of Games',
			STATS_BEST: 'Best time',
			LICENSE: 'License',
			SHORTCUTS: 'Shortcuts',
			SETTINGS: 'Info',
			STATS: 'Stats',
			MODE: 'Board Fill Algorithm',
			MODE_SOLVABLE: 'Solvable',
			MODE_LINEAR: 'Linear',
			AUDIO: 'Audio',
			AUDIO_SOUNDS: 'Sounds',
			AUDIO_MUSIC: 'Music',
			LANG: 'Language',
			LANG_EN: 'English',
			LANG_DE: 'German',
			LANG_AUTO: '[Default]',
			OPEN_SETTINGS: 'Click here to open the settings'
		});
		translate.setTranslation('de', {
			RESTART: 'Neustart',
			UNDO: 'Zurück',
			PAUSE: 'Pause',
			HINT: 'Tip',
			STONES: 'Steine',
			FREE: 'Frei',
			FULLSCREEN: 'Vollbild',
			SETTINGS: 'Info',
			HINT_LONG: 'Mögliche Züge anzeigen',
			UNDO_LONG: 'Letzten Zug rückgängig machen',
			RESTART_LONG: 'Neues Spiel beginnen',
			PAUSE_LONG: 'Spiel anhalten/fortfahren',
			MSG_CONTINUE_PAUSE: 'Spiel fortsetzen...',
			MSG_CONTINUE_SAVE: 'Geladenes Spiel fortsetzen...',
			MSG_START: 'Spiel starten',
			MSG_PLAY_AGAIN: 'Nochmal spielen',
			MSG_BEST: 'Gratulation, neue Bestzeit!',
			MSG_GOOD: 'Sehr schön!',
			MSG_FAIL: 'Keine passenden Ziegel mehr.',
			STATS_GAMES: 'Anzahl Spiele',
			STATS_BEST: 'Bestzeit',
			LICENSE: 'Lizenz',
			SHORTCUTS: 'Tastaturkürzel',
			STATS: 'Statistik',
			MODE: 'Spielbrett-Algorithmus',
			MODE_SOLVABLE: 'Lösbar',
			MODE_LINEAR: 'Linear',
			AUDIO: 'Audio',
			AUDIO_SOUNDS: 'Töne',
			AUDIO_MUSIC: 'Musik',
			LANG: 'Sprache',
			LANG_AUTO: '[Standard]',
			LANG_EN: 'Englisch',
			LANG_DE: 'Deutsch',
			OPEN_SETTINGS: 'Klick hier um die Einstellungen zu öffnen'
		});
		translate.setDefaultLang('en');
		const loader = new ImagePreloader();
		const tiles = new Tiles();
		tiles.list.forEach((tile) => {
			loader.add('assets/img/tiles/' + tile.img.id + '.png');
		});
		loader.start(() => {
			this.loading = false;
		}, (progress: number) => {
			this.loaded = (progress * 100).toFixed(2) + '%';
		});
		layouts.get((res: Layouts) => {
			this.layouts = res;
		});
		this.game.init();

		// does not work:
		// @HostListener('window:onbeforeunload')
		// public onBeforeUnload() {}
		// => old style!

		window.addEventListener('beforeunload', () => {
			if (this.game.isRunning()) {
				this.game.pause();
			}
			return null;
		}, false);
		window.addEventListener('blur', () => {
			if (this.game.isRunning()) {
				this.game.pause();
			}
		}, false);

	}
}
