export const SOUNDS = {
	NOPE: '245764__unclesigmund__small-stones_4.656',
	MATCH: '245764__unclesigmund__small-stones_4.822',
	OVER: '329678__manuts__sound-logo-trademark-12'
};

export class Sound {
	private audioplayers: {
		[index: string]: HTMLAudioElement;
	} = {};

	constructor() {
	}

	public play(sound: string) {
		if (!this.audioplayers[sound]) {
			const audio = new Audio();
			audio.src = 'assets/sounds/' + sound + '.' + 'ogg';
			audio.load();
			this.audioplayers[sound] = audio;
		}
		this.audioplayers[sound].play();
	}

	public pause(sound: string) {
		if (this.audioplayers[sound]) {
			this.audioplayers[sound].pause();
		}
	}
}
