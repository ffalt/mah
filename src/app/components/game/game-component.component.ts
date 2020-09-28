import {Component, HostListener, Input} from '@angular/core';
import {Game} from '../../model/game';
import {Stone} from '../../model/stone';
import {Layout, Layouts} from '../../model/types';
import {AppService} from '../../service/app.service';

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
	@Input() layouts: Layouts;
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

	@HostListener('document:keydown', ['$event'])
	handleKeyDownEvent(event: KeyboardEvent): void {
		if (this.helpVisible) {
			if (event.keyCode === 27) {
				this.toggleHelp();
			}
			return;
		}
		if (this.newGameVisible) {
			if (event.keyCode === 27) {
				this.newGameVisible = !this.newGameVisible;
			}
			return;
		}
		if (this.tilesInfoVisible) {
			if (event.keyCode === 27) {
				this.toggleTilesInfo();
			}
			return;
		}
		if (this.settingsVisible) {
			if (event.keyCode === 27) {
				this.toggleSettings();
			}
			return;
		}
		switch (event.which) {
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

	startGame(data: { layout: Layout, mode: string }): void {
		this.newGameVisible = false;
		this.game.reset();
		this.game.start(data.layout, data.mode);
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
