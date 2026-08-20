import { describe, it, expect, beforeEach } from 'vitest';
import { SCORE_BASE_POINTS, SCORE_COMBO_WINDOW, Score } from './score';

describe('Score', () => {
	let score: Score;

	beforeEach(() => {
		score = new Score();
	});

	it('starts empty', () => {
		expect(score.points()).toBe(0);
		expect(score.combo()).toBe(0);
		expect(score.matches()).toBe(0);
		expect(score.multiplier).toBe(1);
	});

	it('awards base points for a match on the ground layer', () => {
		const gained = score.addMatch(1000, 0);
		expect(gained).toBe(SCORE_BASE_POINTS);
		expect(score.points()).toBe(SCORE_BASE_POINTS);
		expect(score.matches()).toBe(1);
	});

	it('awards a depth bonus for higher layers', () => {
		const ground = new Score().addMatch(1000, 0);
		const high = score.addMatch(1000, 3);
		expect(high).toBeGreaterThan(ground);
	});

	it('steps the multiplier up for matches inside the combo window', () => {
		score.addMatch(1000, 0);
		expect(score.multiplier).toBe(1);
		score.addMatch(1000 + SCORE_COMBO_WINDOW, 0);
		expect(score.combo()).toBe(1);
		expect(score.multiplier).toBe(1.25);
		score.addMatch(2000 + SCORE_COMBO_WINDOW, 0);
		expect(score.multiplier).toBe(1.5);
	});

	it('caps the multiplier at the last step', () => {
		let elapsed = 0;
		for (let index = 0; index < 20; index++) {
			elapsed += 100;
			score.addMatch(elapsed, 0);
		}
		expect(score.multiplier).toBe(3);
	});

	it('resets the combo when a match arrives after the window', () => {
		score.addMatch(1000, 0);
		score.addMatch(1500, 0);
		expect(score.combo()).toBe(1);
		score.addMatch(1500 + SCORE_COMBO_WINDOW + 1, 0);
		expect(score.combo()).toBe(0);
		expect(score.multiplier).toBe(1);
	});

	it('breaks the combo on assistance and requires a fresh chain afterwards', () => {
		score.addMatch(1000, 0);
		score.addMatch(1500, 0);
		expect(score.combo()).toBe(1);
		score.breakCombo();
		expect(score.combo()).toBe(0);
		// the next match cannot resume the old chain even though it lands inside the window
		score.addMatch(1600, 0);
		expect(score.combo()).toBe(0);
	});

	it('adds flat bonus points without touching the combo', () => {
		score.addMatch(1000, 0);
		score.addMatch(1500, 0);
		const combo = score.combo();
		score.addBonus(500);
		expect(score.points()).toBe(SCORE_BASE_POINTS + Math.round(SCORE_BASE_POINTS * 1.25) + 500);
		expect(score.combo()).toBe(combo);
	});

	it('resets every counter', () => {
		score.addMatch(1000, 2);
		score.addBonus(200);
		score.reset();
		expect(score.points()).toBe(0);
		expect(score.matches()).toBe(0);
		expect(score.combo()).toBe(0);
	});

	it('restores points and matches without a combo when none was stored', () => {
		score.load({ points: 1234, matches: 7, combo: 0, history: [] });
		expect(score.points()).toBe(1234);
		expect(score.matches()).toBe(7);
		expect(score.combo()).toBe(0);
		// no chain to pick up, so the next match starts a fresh one
		score.addMatch(1000, 0);
		expect(score.combo()).toBe(0);
	});

	it('carries a live combo chain through a save cycle', () => {
		score.addMatch(1000, 0);
		score.addMatch(1200, 0);
		expect(score.combo()).toBe(1);

		const restored = new Score();
		restored.load(score.save());

		expect(restored.combo()).toBe(1);
		// the chain is still inside its window, so the next match keeps climbing instead of resetting
		restored.addMatch(1400, 0);
		expect(restored.combo()).toBe(2);
	});

	it('drops a stored chain whose window has passed', () => {
		score.addMatch(1000, 0);
		score.addMatch(1200, 0);

		const restored = new Score();
		restored.load(score.save());
		restored.addMatch(1200 + SCORE_COMBO_WINDOW + 1, 0);

		expect(restored.combo()).toBe(0);
	});

	it('gives back the points of the undone match', () => {
		score.addMatch(1000, 2);
		const before = score.points();
		score.addMatch(1500, 3);
		score.undoMatch();
		expect(score.points()).toBe(before);
		expect(score.matches()).toBe(1);
	});

	it('gives back bonus points that were awarded for the undone match', () => {
		score.addMatch(1000, 0);
		score.addBonus(500);
		score.undoMatch();
		expect(score.points()).toBe(0);
		expect(score.matches()).toBe(0);
	});

	it('forfeits the chain on an undo, so replaying a pair can never gain', () => {
		score.addMatch(1000, 0);
		score.addMatch(1200, 0);
		expect(score.combo()).toBe(1);
		score.undoMatch();
		expect(score.combo()).toBe(0);
		const replayed = score.addMatch(1200, 0);
		expect(replayed).toBe(SCORE_BASE_POINTS);
	});

	it('cannot inflate the score by picking and undoing the same pair', () => {
		score.addMatch(1000, 4);
		const once = score.points();
		for (let index = 0; index < 20; index++) {
			score.undoMatch();
			score.addMatch(1000, 4);
		}
		expect(score.points()).toBe(once);
		expect(score.matches()).toBe(1);
	});

	it('ignores an undo with nothing to take back', () => {
		score.load({ points: 1234, matches: 7, combo: 0, history: [] });
		score.undoMatch();
		expect(score.points()).toBe(1234);
		expect(score.matches()).toBe(7);
	});

	it('carries the undo history through a save cycle', () => {
		score.addMatch(1000, 1);
		const before = score.points();
		score.addMatch(1500, 1);
		const restored = new Score();
		restored.load(score.save());
		restored.undoMatch();
		expect(restored.points()).toBe(before);
		expect(restored.matches()).toBe(1);
	});
});
