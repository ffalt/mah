import { rng, mulberry32, stringToSeed, seedRNG, resetRNG, generateLayoutSeed } from './rng';

describe('rng', () => {
	afterEach(() => {
		resetRNG();
	});

	describe('mulberry32', () => {
		it('produces the same sequence for the same seed', () => {
			const gen1 = mulberry32(42);
			const gen2 = mulberry32(42);
			expect(gen1()).toBe(gen2());
			expect(gen1()).toBe(gen2());
			expect(gen1()).toBe(gen2());
		});

		it('advances state on each call', () => {
			const gen = mulberry32(42);
			const first = gen();
			const second = gen();
			const third = gen();
			expect(first).not.toBe(second);
			expect(second).not.toBe(third);
		});

		it('produces different sequences for different seeds', () => {
			const gen1 = mulberry32(1);
			const gen2 = mulberry32(2);
			expect(gen1()).not.toBe(gen2());
		});

		it('returns values in [0, 1)', () => {
			const gen = mulberry32(99);
			for (let index = 0; index < 100; index++) {
				const value = gen();
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThan(1);
			}
		});
	});

	describe('stringToSeed', () => {
		it('is deterministic', () => {
			expect(stringToSeed('hello')).toBe(stringToSeed('hello'));
		});

		it('returns different values for different strings', () => {
			expect(stringToSeed('hello')).not.toBe(stringToSeed('world'));
		});
	});

	describe('seedRNG / resetRNG', () => {
		it('produces the same sequence when seeded with the same string', () => {
			seedRNG('x');
			const first = rng();
			const second = rng();
			resetRNG();
			seedRNG('x');
			expect(rng()).toBe(first);
			expect(rng()).toBe(second);
		});

		it('produces different sequences for different seeds', () => {
			seedRNG('seed-a');
			const resultA = rng();
			resetRNG();
			seedRNG('seed-b');
			expect(rng()).not.toBe(resultA);
		});

		it('after resetRNG a re-seed produces the same sequence as a fresh seed', () => {
			seedRNG('hello');
			const result = rng();
			resetRNG();
			seedRNG('hello');
			expect(rng()).toBe(result);
		});
	});

	describe('generateLayoutSeed', () => {
		it('returns a 10-character string', () => {
			expect(generateLayoutSeed()).toHaveLength(10);
		});

		it('contains only lowercase letters and digits', () => {
			for (let index = 0; index < 20; index++) {
				expect(generateLayoutSeed()).toMatch(/^[a-z0-9]{10}$/);
			}
		});

		it('uses Math.random (not the seeded rng)', () => {
			seedRNG('fixed');
			const seeded = rng();
			resetRNG();
			// generateLayoutSeed uses Math.random directly, not rng()
			// so seeding has no effect on it
			seedRNG('fixed');
			generateLayoutSeed();
			expect(rng()).toBe(seeded);
		});
	});
});
