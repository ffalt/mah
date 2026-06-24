import { hashCode } from './hash';

let _rng: () => number = Math.random;

export function rng(): number {
	return _rng();
}

export function mulberry32(seed: number): () => number {
	// eslint-disable-next-line unicorn/prefer-math-trunc
	let state = seed | 0;
	return () => {
		// | 0 wraps to int32 - required by the mulberry32 algorithm, not mere truncation
		// eslint-disable-next-line unicorn/prefer-math-trunc
		state = (state + 0x6D_2B_79_F5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

function mix32(n: number): number {
	// eslint-disable-next-line unicorn/numeric-separators-style
	let h = Math.imul(n ^ (n >>> 16), 0x9E3779B9);
	// eslint-disable-next-line unicorn/numeric-separators-style
	h = Math.imul(h ^ (h >>> 16), 0x9E3779B9);
	return h ^ (h >>> 16);
}

export function stringToSeed(s: string): number {
	return mix32(hashCode(s));
}

export function seedRNG(seed: string): void {
	// eslint-disable-next-line unicorn/no-top-level-assignment-in-function
	_rng = mulberry32(stringToSeed(seed));
}

export function resetRNG(): void {
	// eslint-disable-next-line unicorn/no-top-level-assignment-in-function
	_rng = Math.random;
}

export function generateLayoutSeed(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let index = 0; index < 10; index++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}
