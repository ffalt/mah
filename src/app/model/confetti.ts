import confetti from 'canvas-confetti';
import { randomInRange } from './random';

export class Confetti {
	private throwConfetti(options: confetti.Options): void {
		confetti(options)!.catch(() => undefined);
	}

	private fire(particleRatio: number, options: confetti.Options): void {
		const count = 200;
		this.throwConfetti({
			origin: { y: 0.7 },
			...options,
			particleCount: Math.floor(count * particleRatio)
		});
	}

	private realistic(): void {
		this.fire(0.25, { spread: 26, startVelocity: 55 });
		this.fire(0.2, { spread: 60 });
		this.fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
		this.fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
		this.fire(0.1, { spread: 120, startVelocity: 45 });
	}

	private basic(): void {
		this.throwConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
	}

	private fireworks(): void {
		const duration = 1000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		const interval = setInterval(() => {
			const timeLeft = animationEnd - Date.now();
			if (timeLeft <= 0) {
				return clearInterval(interval);
			}
			const particleCount = 50 * (timeLeft / duration);
			// Since particles fall down, start a bit higher than random.
			this.throwConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
			this.throwConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
		}, 250);
	}

	private randomDirection(): void {
		this.throwConfetti({
			angle: randomInRange(55, 125),
			spread: randomInRange(50, 70),
			particleCount: randomInRange(50, 100),
			origin: { y: 0.6 }
		});
	}

	private stars(): void {
		const defaults = {
			spread: 360,
			ticks: 50,
			gravity: 0,
			decay: 0.94,
			startVelocity: 30,
			colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
		};

		const shoot = () => {
			this.throwConfetti({
				...defaults,
				particleCount: 40,
				scalar: 1.2,
				shapes: ['star']
			});

			this.throwConfetti({
				...defaults,
				particleCount: 10,
				scalar: 0.75,
				shapes: ['circle']
			});
		};

		setTimeout(shoot, 0);
		setTimeout(shoot, 100);
		setTimeout(shoot, 200);
	}

	private schoolPride(): void {
		const end = Date.now() + 1000;
		const colors = ['#bb0000', '#ffffff'];

		const frame = () => {
			this.throwConfetti({
				particleCount: 2,
				angle: 60,
				spread: 55,
				origin: { x: 0 },
				colors
			});
			this.throwConfetti({
				particleCount: 2,
				angle: 120,
				spread: 55,
				origin: { x: 1 },
				colors
			});

			if (Date.now() < end) {
				requestAnimationFrame(frame);
			}
		};

		frame();
	}

	private emoji(): void {
		const scalar = 2;

		const svgPath: { path: string } = {
			// eslint-disable-next-line max-len
			path: 'M461 67c-9 9-7 37 4 74 7 22 10 49 11 83l1 51-45 14c-25 8-59 19-75 24l-30 10-15-16c-24-22-47-31-64-23-7 4-14 11-15 17-1 10 34 69 122 208 11 17 24 32 28 32 16 1 29-2 35-7 8-6 62-11 62-5 1 2 1 41 2 87 4 155 7 212 16 254 12 57 27 71 34 32 1-9 4-21 5-28 10-40 13-87 16-252 1-53 3-98 5-100 3-4 9-4 65-9 36-2 47-12 87-71 56-84 60-102 35-139-46-69-83-83-153-61l-32 10 1-39c1-21 5-48 9-61 10-27 7-32-42-65-41-26-56-31-67-20m191 252c7 12 3 37-11 84l-12 40-33 5c-18 3-34 4-36 3-5-3-3-121 2-126s52-15 71-14c8 0 17 3 19 8m-173 84 1 61-24 5c-23 5-25 5-34-7-6-7-17-25-24-39-8-14-19-34-24-42l-10-16 31-6c18-3 33-7 34-7 2 0 12-3 23-7 11-3 22-5 23-4 2 1 4 30 4 62'
		};
		const moji = confetti.shapeFromPath(svgPath);

		const defaults = {
			spread: 360,
			ticks: 180,
			gravity: 0,
			decay: 0.96,
			startVelocity: 20,
			shapes: [moji],
			scalar
		};

		const shoot = () => {
			this.throwConfetti({ ...defaults, particleCount: 30 });
			this.throwConfetti({ ...defaults, particleCount: 5, flat: true });
			this.throwConfetti({ ...defaults, particleCount: 15, scalar: scalar / 2 });
		};

		setTimeout(shoot, 0);
		setTimeout(shoot, 100);
		setTimeout(shoot, 200);
	}

	trigger(): void {
		if (!confetti) {
			return;
		}
		const modes: Array<() => void> = [
			() => this.emoji(),
			() => this.schoolPride(),
			() => this.stars(),
			() => this.fireworks(),
			() => this.randomDirection(),
			() => this.realistic(),
			() => this.basic()
		];
		const mode = modes[Math.floor(randomInRange(0, modes.length))];
		mode();
	}
}
