export const SOUNDS = {
	NOPE: 'invalid',
	SELECT: 'select',
	MATCH: 'match',
	OVER: 'over'
};

export class Sound {
	enabled: boolean = true;
	private audioplayers: {
		[index: string]: HTMLAudioElement;
	} = {};

	play(sound: string): void {
		if (!this.enabled) {
			return;
		}
		if (!this.audioplayers[sound]) {
			const audio = new Audio();
			audio.src = `assets/sounds/${sound}.ogg`;
			audio.load();
			this.audioplayers[sound] = audio;
		}
		this.audioplayers[sound].play()
			.catch(error => {
				console.error(error);
			});
	}

	pause(sound: string): void {
		if (this.audioplayers[sound]) {
			this.audioplayers[sound].pause();
		}
	}
}
