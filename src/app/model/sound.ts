export const SOUNDS = {
	NOPE: '245764__unclesigmund__small-stones_4.656',
	MATCH: '245764__unclesigmund__small-stones_4.822',
	OVER: '329678__manuts__sound-logo-trademark-12'
};

export class Sound {
	private audioplayers: {
		[index: string]: HTMLAudioElement;
	} = {};

	play(sound: string): void {
		if (!this.audioplayers[sound]) {
			const audio = new Audio();
			audio.src = `assets/sounds/${sound}.ogg`;
			audio.load();
			this.audioplayers[sound] = audio;
		}
		this.audioplayers[sound].play()
			.catch(e => {
				console.error(e);
			});
	}

	pause(sound: string): void {
		if (this.audioplayers[sound]) {
			this.audioplayers[sound].pause();
		}
	}
}
