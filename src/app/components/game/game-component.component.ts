import { Component, inject, viewChild } from '@angular/core';
import { Game } from '../../model/game';
import { Stone } from '../../model/stone';
import { Layout, Place } from '../../model/types';
import { AppService } from '../../service/app.service';
import { BUILD_MODE_ID } from '../../model/builder';
import { GAME_MODE_ID } from '../../model/consts';
import { WorkerService } from '../../service/worker.service';
import { environment } from '../../../environments/environment';
import { DialogComponent } from '../../modules/core/components/dialog/dialog.component';

interface DocEx extends Document {
	fullScreen: boolean;
	fullscreen: boolean;
	mozFullScreen: boolean;
	webkitIsFullScreen: boolean;
	mozFullscreenEnabled: boolean;
	webkitFullscreenEnabled: boolean;

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
	styleUrls: ['./game-component.component.scss'],
	standalone: false,
	host: { '(document:keydown)': 'handleKeyDownEvent($event)' }
})
export class GameComponent {
	readonly info = viewChild.required<DialogComponent>('info');
	readonly settings = viewChild.required<DialogComponent>('settings');
	readonly help = viewChild.required<DialogComponent>('help');
	readonly newgame = viewChild.required<DialogComponent>('newgame');
	app = inject(AppService);
	game: Game;
	fullScreenEnabled: boolean = true;
	title: string = '';
	workerService = inject(WorkerService);

	constructor() {
		this.game = this.app.game;
		this.fullScreenEnabled = this.canFullscreen();
		this.title = `${this.app.name} v${environment.version}`;
	}

	showNewGame(): void {
		this.newgame().visible.set(true);
	}

	handleKeyDownEventKey(key: string): void {
		switch (key) {
			case 'h':
				this.help().toggle();
				break;
			case 'i':
				this.info().toggle();
				break;
			case 's':
				this.settings().toggle();
				break;
			case 't':
				this.game.hint();
				break;
			case 'm':
				this.game.shuffle();
				break;
			case 'g':
				this.debugSolve();
				break;
			case 'u':
				this.game.back();
				break;
			case 'n':
				this.game.pause();
				this.newgame().toggle();
				break;
			case ' ': // space
			case 'p':
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
		const help = this.help();
		if (help.visible()) {
			help.toggle();
			return true;
		}
		const newgame = this.newgame();
		if (newgame.visible()) {
			newgame.toggle();
			return true;
		}
		const info = this.info();
		if (info.visible()) {
			info.toggle();
			return true;
		}
		const settings = this.settings();
		if (settings.visible()) {
			settings.toggle();
			return true;
		}
		return false;
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		if (event.key === 'Escape' && this.handleKeyDownDialogExit()) {
			return;
		}
		const nodeName = ((event.target as { nodeName?: string })?.nodeName || '').toLocaleLowerCase();
		if (nodeName === 'input') {
			return;
		}
		this.handleKeyDownEventKey(event.key);
	}

	stoneClick(stone?: Stone): void {
		this.game.click(stone);
	}

	canFullscreen(): boolean {
		if (environment.mobile) {
			return false;
		}
		const doc = window.document as DocEx;
		return doc.fullscreenEnabled || doc.mozFullscreenEnabled || doc.webkitFullscreenEnabled;
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
		this.showNewGame();
	}

	startGame(data: { layout: Layout; buildMode: BUILD_MODE_ID; gameMode: GAME_MODE_ID }): void {
		this.newgame().visible.set(false);
		this.game.reset();
		this.game.start(data.layout, data.buildMode, data.gameMode);
	}

	toggleDialogState(dialogVisible: boolean): void {
		if (dialogVisible) {
			if (!this.app.game.isPaused()) {
				this.app.game.pause();
			}
		} else {
			this.app.settings.save();
			if (this.app.game.isPaused()) {
				this.app.game.resume();
			}
		}
	}

	clickMessage(): void {
		if (this.game.isPaused()) {
			this.game.resume();
		} else {
			this.game.reset();
			this.showNewGame();
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
