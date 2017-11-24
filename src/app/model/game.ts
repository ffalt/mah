import {Clock} from './clock';
import {Board} from './board';
import {Music} from './music';
import {Sound, SOUNDS} from './sound';
import {Layout} from './layouts';
import {Stone} from './stone';
import {OnInit} from '@angular/core';

const STATES = {
	idle: 0,
	run: 1,
	pause: 2,
	freeze: 3
};

export class Game implements OnInit {
	public settings = {
		lang: 'auto',
		sounds: true,
		music: false,
		tileset: 'riichi'
	};
	public stats = {
		games: 0,
		bestTime: 0
	};
	public clock: Clock = new Clock();
	public board: Board = new Board();
	public sound: Sound = new Sound();
	public music: Music = new Music();
	public state: number = STATES.idle;
	public message: string = null;
	public undo: Array<Array<number>> = [];
	public onClick: Event;

	constructor() {
	}

	public init() {
		this.loadSettings();
		this.load();
		this.board.update();
		if (this.state === STATES.run) {
			this.pause();
		}
		this.message = this.isPaused() ? 'MSG_CONTINUE_SAVE' : 'MSG_START';
	}

	public ngOnInit() {
		this.onClick = this.click.bind(this);
	}

	private delayedSave(): void {
		setTimeout(() => {
			this.save();
		}, 1000);
	}

	private playSound(sound: string): void {
		if (this.settings.sounds) {
			this.sound.play(sound);
		}
	}

	private resolveMatchingStone(stone: Stone): void {
		const sel = this.board.selected;
		this.board.clearSelection();
		this.undo.push([sel.z, sel.x, sel.y], [stone.z, stone.x, stone.y]);
		this.board.clearHints();
		sel.picked = true;
		stone.picked = true;
		this.board.update();
		let message: string = null;
		if (this.board.count < 2) {
			message = 'MSG_GOOD';
			if (this.stats.bestTime === 0 || this.clock.elapsed < this.stats.bestTime) {
				this.stats.bestTime = this.clock.elapsed;
				message = 'MSG_BEST';
			}
		} else if (this.board.free.length < 1) {
			message = 'MSG_FAIL';
		} else {
			this.playSound(SOUNDS.MATCH);
			return this.delayedSave();
		}
		this.playSound(SOUNDS.OVER);
		this.setState(STATES.idle, message);
		this.clock.reset();
		this.delayedSave();
	}

	public click(stone: Stone) {
		if (!stone) {
			this.board.clearSelection();
			return;
		}
		if (!this.isRunning() || stone.state.blocked) {
			this.playSound(SOUNDS.NOPE);
			return true;
		}
		if (this.clock.elapsed === 0) {
			this.clock.run();
		}
		if (this.board.selected && stone && stone !== this.board.selected && stone.groupnr === this.board.selected.groupnr) {
			this.resolveMatchingStone(stone);
			return true;
		} else {
			this.board.setStoneSelected(this.board.selected !== stone ? stone : null);
			return true;
		}
	}

	public isRunning() {
		return this.state === STATES.run;
	}

	//
	// public isFreezed() {
	// 	return this.state === STATES.freeze;
	// }

	public isPaused() {
		return this.state === STATES.pause;
	}

	public isIdle() {
		return this.state === STATES.idle;
	}

	public resume() {
		this.run();
		this.clock.run();
		if (this.settings.music) {
			this.music.play();
		}
	}

	// public freeze() {
	// 	this.setState(STATES.freeze);
	// 	this.clock.pause();
	// }
	// public unfreeze() {
	//  this.setState(STATES.run);
	// 	this.clock.run();
	// 	if (this.settings.music) {
	// 		this.music.play();
	// 	}
	// }

	private setState(state: number, message?: string) {
		this.message = message;
		this.state = state;
	}

	public run() {
		this.board.clearHints();
		this.board.update();
		this.setState(STATES.run);
	}

	public hint() {
		this.board.hint();
	}

	public toggle() {
		if (this.state === STATES.run) {
			this.pause();
		} else if (this.state === STATES.pause) {
			this.resume();
		}
	}

	public pause() {
		this.clock.pause();
		this.setState(STATES.pause, 'MSG_CONTINUE_PAUSE');
		this.save();
		if (this.settings.music) {
			this.music.pause();
		}
	}

	public reset() {
		this.clock.reset();
		this.setState(STATES.idle);
		this.board.reset();
		this.undo = [];
		this.stats.games += 1;
	}

	public start(layout: Layout, mode: string) {
		this.board.applyLayout(layout, mode);
		this.board.update();
		this.run();
	}

	public back() {
		if (!this.isRunning() || (this.undo.length < 2)) {
			return;
		}
		this.board.clearSelection();
		this.board.clearHints();
		const n1 = this.undo.pop();
		const n2 = this.undo.pop();
		this.board.stones.forEach((stone) => {
			if ((stone.z === n1[0]) && (stone.x === n1[1]) && (stone.y === n1[2])) {
				stone.picked = false;
			} else if ((stone.z === n2[0]) && (stone.x === n2[1]) && (stone.y === n2[2])) {
				stone.picked = false;
			}
		});
		this.board.update();
	}

	public load() {
		if (!localStorage) {
			return false;
		}
		const stored = localStorage.getItem('state');
		if (!stored) {
			return false;
		}
		try {
			const store = JSON.parse(stored);
			this.clock.elapsed = store.elapsed || 0;
			this.undo = store.undo || [];
			this.state = store.state || STATES.idle;
			this.board.load(store.stones, this.undo);
		} catch (e) {
			console.error('local storage load failed', e);
		}
	}

	public save() {
		if (!localStorage) {
			return false;
		}
		try {
			localStorage.setItem('state', JSON.stringify({
				elapsed: this.clock.elapsed,
				state: this.state,
				undo: this.undo,
				stones: this.board.save()
			}));
		} catch (e) {
			console.error('local storage save failed', e);
		}
	}

	public toggleSound() {
		this.settings.sounds = !this.settings.sounds;
		this.saveSettings();
	}

	//
	// public toggleMusic() {
	// 	this.settings.music = !this.settings.music;
	// 	if (!this.settings.music) {
	// 		this.music.stop();
	// 	} else {
	// 		this.music.play();
	// 	}
	// 	this.saveSettings();
	// }

	public loadSettings() {
		if (!localStorage) {
			return false;
		}
		const stored = localStorage.getItem('settings');
		if (!stored) {
			return false;
		}
		try {
			const store = JSON.parse(stored);
			this.settings.lang = store.lang || 'auto';
			this.settings.tileset = store.tileset || 'riichi';
			this.settings.music = store.music || false;
			this.settings.sounds = store.sounds || false;
			this.stats.games = store.games || 0;
			this.stats.bestTime = store.bestTime || 0;
		} catch (e) {
			console.error('local storage load failed', e);
		}
	}

	public saveSettings() {
		if (!localStorage) {
			return false;
		}
		try {
			localStorage.setItem('settings', JSON.stringify({
				lang: this.settings.lang,
				sounds: this.settings.sounds,
				music: this.settings.music,
				tileset: this.settings.tileset,
				games: this.stats.games,
				bestTime: this.stats.bestTime
			}));
		} catch (e) {
			console.error('local storage save failed', e);
		}
	}
}
