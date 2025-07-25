import type { Tile } from './solver.types';

export function rand(): number {
	return Math.floor(Math.random() * 100);
}

// computes if the solver can play a tile
export function isPlayable(t?: Tile): boolean {
	if (!t) {
		return false;
	}
	let k = 0;
	// checks if there are no above neighbo(u)rs
	let above = t.above[k];
	while (above !== undefined) {
		if (!above.isPlayed) {
			return false;
		}
		k++;
		above = t.above[k];
	}
	k = 0;
	let left = t.left[k];
	// checks if there are no left neighbo(u)rs
	while (left !== undefined) {
		if (!left.isPlayed) {
			k = 0;
			// checks if there are no right neighbo(u)rs
			let right = t.right[k];
			while (right !== undefined) {
				if (!right.isPlayed) {
					return false;
				}
				k++;
				right = t.right[k];
			}
			return true;
		}
		k++;
		left = t.left[k];
	}
	return true;
}
