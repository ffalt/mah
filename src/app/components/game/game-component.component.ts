import {Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Game} from '../../model/game';
import {Layout, Layouts} from '../../model/layouts';
import {TranslateService} from 'ng2-translate';
import {Stone} from '../../model/stone';


interface DocEx extends Document {
	exitFullscreen: () => void;
	mozCancelFullScreen: () => void;
	webkitExitFullscreen: () => void;
	fullScreen: boolean;
	fullscreen: boolean;
	mozFullScreen: boolean;
	webkitIsFullScreen: boolean;
}

interface ElemEx extends HTMLElement {
	requestFullscreen: () => void;
	webkitRequestFullScreen: () => void;
	mozRequestFullScreen: () => void;
}

@Component({
	selector: 'app-game-component',
	templateUrl: 'game-component.component.html',
	styleUrls: ['game-component.component.scss']
})
export class GameComponent implements OnInit, OnChanges {
	@Input() public game: Game;
	@Input() public layouts: Layouts;
	public onClickCallback: Event;
	public onGameStartCallback: Event;
	public helpVisible = false;
	public newGameVisible = false;

	constructor(private translate: TranslateService, private el: ElementRef) {
	}

	@HostListener('document:keydown', ['$event'])
	public handleKeyDownEvent(event: KeyboardEvent) {
		if (this.helpVisible) {
			if (event.keyCode === 27) {
				this.helpVisible = !this.helpVisible;
			}
			return;
		}
		if (this.newGameVisible) {
			if (event.keyCode === 27) {
				this.newGameVisible = !this.newGameVisible;
			}
			return;
		}
		switch (event.which) {
			case 72: // h
				this.helpVisible = !this.helpVisible;
				break;
			case 84: // t
				this.game.hint();
				break;
			case 68: // d
				// this.game.debug = !this.game.debug;
				break;
			case 85: // u
				this.game.back();
				break;
			case 78: // n
				this.game.reset();
				break;
			case 32: // space
			case 80: // p
				if (this.game.isRunning()) {
					this.game.pause();
				} else if (this.game.isPaused()) {
					this.game.resume();
				}
				break;
		}
	}

	public ngOnInit() {
		this.onClickCallback = this.stoneClick.bind(this);
		this.onGameStartCallback = this.startGame.bind(this);
		this.setLang();
	}

	public ngOnChanges(changes: SimpleChanges) {
		if (changes['game']) {
			if (this.game.isIdle()) {
				this.newGameVisible = true;
			}
		}
	}

	public stoneClick(stone: Stone) {
		this.game.click(stone);
	}

	public enterFullScreen() {
		const doc = <DocEx>window.document;
		if (doc.fullScreen || doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen) {
			if (doc.exitFullscreen) {
				doc.exitFullscreen();
			} else if (doc.mozCancelFullScreen) {
				doc.mozCancelFullScreen();
			} else if (doc.webkitExitFullscreen) {
				doc.webkitExitFullscreen();
			}
			return;
		}
		const elem = <ElemEx>this.el.nativeElement;
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.webkitRequestFullScreen) {
			elem.webkitRequestFullScreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		}
	}

	public newGame() {
		this.game.pause();
		this.newGameVisible = true;
	}

	public startGame(layout: Layout, mode: string) {
		this.newGameVisible = false;
		this.game.reset();
		this.game.start(layout, mode);
	}

	public toggleNewGame() {
		if (!this.game.isIdle()) {
			this.newGameVisible = !this.newGameVisible;
		}
	}

	public toggleHelp() {
		this.helpVisible = !this.helpVisible;
		if (!this.helpVisible) {
			this.game.saveSettings();
			this.setLang();
		}
	}

	public clickMessage() {
		if (this.game.isPaused()) {
			this.game.resume();
		} else {
			this.game.reset();
		}
	}

	public setLang() {
		let userLang = 'en';
		if (!this.game.settings.lang || this.game.settings.lang === 'auto') {
			userLang = navigator.language.split('-')[0]; // use navigator lang if available
			userLang = /(de|en)/gi.test(userLang) ? userLang : 'en';
		} else {
			userLang = this.game.settings.lang;
		}
		if (['de', 'en'].indexOf(userLang) >= 0) {
			this.translate.use(userLang);
		}
	}

}
