import {Component, HostListener} from '@angular/core';
import {Game} from '../../model/game';
import {Stone} from '../../model/stone';
import {Layout} from '../../model/types';
import {AppService} from '../../service/app.service';
import {BUILD_MODE_ID} from '../../model/builder';
import {GAME_MODE_ID, GameModes} from '../../model/consts';

interface DocEx extends Document {
	fullScreen: boolean;
	fullscreen: boolean;
	mozFullScreen: boolean;
	webkitIsFullScreen: boolean;

	mozCancelFullScreen(): void;

	webkitExitFullscreen(): void;
}

interface ElemEx extends HTMLElement {
	webkitRequestFullScreen(): void;

	mozRequestFullScreen(): void;
}

@Component({
	selector: 'app-game-component',
	templateUrl: './game-component.component.html',
	styleUrls: ['./game-component.component.scss']
})
export class GameComponent {
	game: Game;
	tilesInfoVisible: boolean = false;
	helpVisible: boolean = false;
	settingsVisible: boolean = false;
	newGameVisible: boolean = false;

	constructor(public app: AppService) {
		this.game = app.game;
		if (this.game.isIdle()) {
			this.newGameVisible = true;
		}
	}

	handleKeyDownEventKey(which: number): void {
		switch (which) {
			case 72: // h
				this.toggleHelp();
				break;
			case 73: // i
				this.toggleTilesInfo();
				break;
			case 83: // s
				this.toggleSettings();
				break;
			case 84: // t
				this.game.hint();
				break;
			case 85: // u
				this.game.back();
				break;
			case 78: // n
				this.game.pause();
				this.newGameVisible = true;
				break;
			case 32: // space
			case 80: // p
				if (this.game.isRunning()) {
					this.game.pause();
				} else if (this.game.isPaused()) {
					this.game.resume();
				}
				break;
			default:
				break;
		}
	}

	handleKeyDownDialogExit(): boolean {
		if (this.helpVisible) {
			this.toggleHelp();
			return true;
		}
		if (this.newGameVisible) {
			this.newGameVisible = !this.newGameVisible;
			return true;
		}
		if (this.tilesInfoVisible) {
			this.toggleTilesInfo();
			return true;
		}
		if (this.settingsVisible) {
			this.toggleSettings();
			return true;
		}
		return false;
	}

	@HostListener('document:keydown', ['$event'])
	handleKeyDownEvent(event: KeyboardEvent): void {
		if (event.keyCode === 27 && this.handleKeyDownDialogExit()) {
			return;
		}
		const nodeName = ((event.target as any)?.nodeName || '').toLocaleLowerCase();
		if (nodeName === 'input') {
			return;
		}
		this.handleKeyDownEventKey(event.which);
	}

	stoneClick(stone: Stone): void {
		this.game.click(stone);
	}

	enterFullScreen(): void {
		const doc = window.document as DocEx;
		if (doc.fullScreen || doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen) {
			if (doc.exitFullscreen) {
				doc.exitFullscreen()
					.catch(e => {
						console.error(e);
					});
			} else if (doc.mozCancelFullScreen) {
				doc.mozCancelFullScreen();
			} else if (doc.webkitExitFullscreen) {
				doc.webkitExitFullscreen();
			}
			return;
		}
		const elem = document.body as ElemEx; // this.el.nativeElement;
		if (elem.requestFullscreen) {
			elem.requestFullscreen()
				.catch(e => {
					console.error(e);
				});
		} else if (elem.webkitRequestFullScreen) {
			elem.webkitRequestFullScreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		}
	}

	newGame(): void {
		this.game.pause();
		this.newGameVisible = true;
	}

	startGame(data: { layout: Layout; buildMode: BUILD_MODE_ID; gameMode: GAME_MODE_ID }): void {
		this.newGameVisible = false;
		this.game.reset();
		this.game.start(data.layout, data.buildMode, data.gameMode);
	}

	toggleNewGame(): void {
		// if (!this.game.isIdle()) {
		this.newGameVisible = !this.newGameVisible;
		// }
	}

	toggleTilesInfo(): void {
		this.tilesInfoVisible = !this.tilesInfoVisible;
	}

	toggleSettings(): void {
		this.settingsVisible = !this.settingsVisible;
		if (!this.settingsVisible) {
			this.app.settings.save();
		}
	}

	toggleHelp(): void {
		this.helpVisible = !this.helpVisible;
	}

	clickMessage(): void {
		if (this.game.isPaused()) {
			this.game.resume();
		} else {
			this.game.reset();
			this.newGameVisible = true;
		}
	}

	// debugCheat(): void {
	// 	(this.game as any).gameOverWining();
	// }

}
