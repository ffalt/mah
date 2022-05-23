import {Component, HostListener} from '@angular/core';
import {Game} from '../../model/game';
import {Stone, StonePosition} from '../../model/stone';
import {Layout, Place} from '../../model/types';
import {AppService} from '../../service/app.service';
import {BUILD_MODE_ID} from '../../model/builder';
import {GAME_MODE_ID, GameModes} from '../../model/consts';
import {WorkerService} from '../../service/worker.service';
import {environment} from '../../../environments/environment';

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

	constructor(public app: AppService, private workerService: WorkerService) {
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
			case 71: // g
				this.debugSolve();
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

	debugSolve(): void {
		if (environment.production) {
			return;
		}
		const play = (index: number, list: Array<Place>) => {
			const t1 = list[index];
			const t2 = list[index + 1];
			if (!t1 || !t2) {
				return;
			}
			const stones = this.game.board.stones.filter(s => (
				(s.z === t1[0]) && (s.x === t1[1]) && (s.y === t1[2]) ||
				(s.z === t2[0]) && (s.x === t2[1]) && (s.y === t2[2]))
			);
			if (stones.length > 1) {
				stones.forEach(stone => {
					stone.selected = true;
				});
				setTimeout(() => {
					this.game.board.pick(stones[0], stones[1]);
					play(index + 2, list);
				}, 300);
			}
		};

		this.workerService.solveGame(this.game.board.stones.filter(s => !s.picked).map(s => s.toPosition()), data => {
			play(0, data.order);
		});
	}

	// debugCheat(): void {
	// 	this.game.gameOverWining();
	// }

}
