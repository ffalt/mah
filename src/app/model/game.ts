import {Board} from './board';
import {Clock} from './clock';
import {STATES} from './consts';
import {Sound, SOUNDS} from './sound';
import {Stone} from './stone';
import {GameStateStore, Layout, LayoutBestTime, StorageProvider} from './types';

export class Game {
	clock: Clock = new Clock();
	board: Board = new Board();
	sound: Sound = new Sound();
// music: Music = new Music();
	state: number = STATES.idle;
	message: string = undefined;
	layoutID: string = undefined;
	undo: Array<Array<number>> = [];

	constructor(private storage: StorageProvider) {
	}

	init(): void {
		this.load();
		this.board.update();
		if (this.state === STATES.run) {
			this.pause();
		}
		this.message = this.isPaused() ? 'MSG_CONTINUE_SAVE' : 'MSG_START';
	}

	click(stone: Stone): boolean {
		if (!stone) {
			this.board.clearSelection();
			return false;
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
		}
		if (this.board.selected !== stone) {
			this.playSound(SOUNDS.SELECT);
		}
		this.board.setStoneSelected(this.board.selected !== stone ? stone : undefined);
		return true;
	}

	isRunning(): boolean {
		return this.state === STATES.run;
	}

	isFreezed(): boolean {
		return this.state === STATES.freeze;
	}

	isPaused(): boolean {
		return this.state === STATES.pause;
	}

	isIdle(): boolean {
		return this.state === STATES.idle;
	}

	resume(): void {
		this.run();
		this.clock.run();
		// if (this.settings.music) {
		// 	this.music.play();
		// }
	}

	freeze(): void {
		this.setState(STATES.freeze);
		this.clock.pause();
	}

	unfreeze(): void {
		this.setState(STATES.run);
		this.clock.run();
		// if (this.settings.music) {
		// 	this.music.play();
		// }
	}

	run(): void {
		this.board.clearHints();
		this.board.update();
		this.setState(STATES.run);
	}

	hint(): void {
		this.board.hint();
	}

	toggle(): void {
		if (this.state === STATES.run) {
			this.pause();
		} else if (this.state === STATES.pause) {
			this.resume();
		}
	}

	pause(): void {
		this.clock.pause();
		this.setState(STATES.pause, 'MSG_CONTINUE_PAUSE');
		this.save();
		// if (this.settings.music) {
		// 	this.music.pause();
		// }
	}

	reset(): void {
		this.clock.reset();
		this.setState(STATES.idle);
		this.board.reset();
		this.undo = [];
	}

	start(layout: Layout, mode: string): void {
		this.layoutID = layout.id;
		this.board.applyMapping(layout.mapping, mode);
		this.board.update();
		this.run();
	}

	back(): void {
		if (!this.isRunning() || (this.undo.length < 2)) {
			return;
		}
		this.board.clearSelection();
		this.board.clearHints();
		const n1 = this.undo.pop();
		const n2 = this.undo.pop();
		this.board.stones.forEach(stone => {
			if ((stone.z === n1[0]) && (stone.x === n1[1]) && (stone.y === n1[2])) {
				stone.picked = false;
			} else if ((stone.z === n2[0]) && (stone.x === n2[1]) && (stone.y === n2[2])) {
				stone.picked = false;
			}
		});
		this.board.update();
	}

	load(): boolean {
		try {
			const store: GameStateStore = this.storage.get<GameStateStore>('state');
			if (store) {
				this.clock.elapsed = store.elapsed || 0;
				this.undo = store.undo || [];
				this.layoutID = store.layout;
				this.state = store.state || STATES.idle;
				this.board.load(store.stones, this.undo);
				return true;
			}
		} catch (e) {
			console.error('load state failed', e);
		}
	}

	save(): void {
		try {
			this.storage.set('state', {
				elapsed: this.clock.elapsed,
				state: this.state,
				layout: this.layoutID,
				undo: this.undo,
				stones: this.board.save()
			});
		} catch (e) {
			console.error('storing state failed', e);
		}
	}

	checkPlayEnd(): void {
		if (this.board.count < 2) {
			const id = this.layoutID || 'unknown';
			const playTime = this.clock.elapsed;
			const score = this.storage.get<LayoutBestTime>(`highscore:${id}`) || {};
			score.playCount = (score.playCount || 0) + 1;
			if (!score.bestTime || score.bestTime > playTime) {
				score.bestTime = playTime;
				this.gameOver('MSG_BEST');
			} else {
				this.gameOver('MSG_GOOD');
			}
			this.storage.set<LayoutBestTime>(`highscore:${id}`, score);
		} else if (this.board.free.length < 1) {
			const id = this.layoutID || 'unknown';
			const score = this.storage.get<LayoutBestTime>(`highscore:${id}`) || {};
			score.playCount = (score.playCount || 0) + 1;
			this.storage.set<LayoutBestTime>(`highscore:${id}`, score);
			this.gameOver('MSG_FAIL');
		} else {
			this.playSound(SOUNDS.MATCH);
			this.delayedSave();
		}
	}

	// toggleMusic(): void {
	// if (!this.settings.music) {
	// 	this.music.stop();
	// } else {
	// 	this.music.play();
	// }
	// }

	private delayedSave(): void {
		setTimeout(() => {
			this.save();
		}, 500);
	}

	private playSound(sound: string): void {
		this.sound.play(sound);
	}

	private resolveMatchingStone(stone: Stone): void {
		const sel = this.board.selected;
		this.board.clearSelection();
		this.undo.push([sel.z, sel.x, sel.y], [stone.z, stone.x, stone.y]);
		this.board.clearHints();
		sel.picked = true;
		stone.picked = true;
		this.board.update();
		this.checkPlayEnd();
	}

	private gameOver(message: string): void {
		this.playSound(SOUNDS.OVER);
		this.setState(STATES.idle, message);
		this.clock.reset();
		this.delayedSave();
	}

	private setState(state: number, message?: string): void {
		this.message = message;
		this.state = state;
	}

}
