import {ImageSetDefault} from './consts';

export class Settings {
	public lang = 'auto';
	public sounds = true;
	public music = false;
	public tileset = ImageSetDefault;
	public background = '';
	public stats = {
		games: 0,
		bestTime: 0
	};
	constructor() {
	}

	load() {
		if (!localStorage) {
			return false;
		}
		const stored = localStorage.getItem('settings');
		if (!stored) {
			return false;
		}
		try {
			const store = JSON.parse(stored);
			this.lang = store.lang || 'auto';
			this.tileset = store.tileset || ImageSetDefault;
			this.background = store.background;
			this.music = store.music || false;
			this.sounds = store.sounds || false;
			this.stats.games = store.games || 0;
			this.stats.bestTime = store.bestTime || 0;
		} catch (e) {
			console.error('local storage load failed', e);
		}
	}

	public save() {
		if (!localStorage) {
			return false;
		}
		try {
			localStorage.setItem('settings', JSON.stringify({
				lang: this.lang,
				sounds: this.sounds,
				music: this.music,
				background: this.background,
				tileset: this.tileset,
				games: this.stats.games,
				bestTime: this.stats.bestTime
			}));
		} catch (e) {
			console.error('local storage save failed', e);
		}
	}
}
