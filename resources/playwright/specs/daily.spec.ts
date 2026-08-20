import { type Locator, type Page, expect, test } from '@playwright/test';
import { CHALLENGE_CODES, CHALLENGE_IDS, type CHALLENGE_ID, challengeName } from '../../../src/app/model/challenge/consts';
import { dailyKey, dailyMonthKey, pickDailyChallenge } from '../../../src/app/model/challenge/daily';
import { captureDialogScreenshots, closeOverlay, openDailyChallenge, screenshot, startDailyChallenge, startGame } from './common';

interface SeedDay {
	offset: number;
	won: boolean;
	attempts: number;
	firstTry: boolean;
	playTime?: number;
	score?: number;
}

// a fixed day keeps the calendar, the board of the day and the challenge rotation identical on every run
const TODAY = new Date(2026, 5, 15, 10, 0, 0);
const SCROLL_TARGET = 'app-daily-challenge';

// a run of wins ending yesterday, one miss before it and two older wins - enough for streak, calendar and best scores
const HISTORY: Array<SeedDay> = [
	{ offset: -1, won: true, attempts: 1, firstTry: true, playTime: 121_000, score: 5720 },
	{ offset: -2, won: true, attempts: 2, firstTry: false, playTime: 164_000, score: 3410 },
	{ offset: -3, won: true, attempts: 1, firstTry: true, playTime: 98_000, score: 6180 },
	{ offset: -4, won: false, attempts: 3, firstTry: false, score: 1240 },
	{ offset: -6, won: true, attempts: 1, firstTry: true, playTime: 143_000, score: 4460 },
	{ offset: -8, won: false, attempts: 1, firstTry: false, score: 780 },
	{ offset: -9, won: true, attempts: 1, firstTry: true, playTime: 175_000, score: 2990 }
];

// CHALLENGE_MIDAS_MATCH -> midas-match, used for test and screenshot names
function challengeSlug(challenge: CHALLENGE_ID): string {
	return challengeName(challenge).replace('CHALLENGE_', '').toLowerCase().replaceAll('_', '-');
}

function dayOffset(date: Date, offset: number): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset, 10, 0, 0);
}

// the first upcoming day that rotates in each challenge, so every challenge can be shown as the challenge of the day
function findChallengeDates(base: Date): Map<CHALLENGE_ID, Date> {
	const dates = new Map<CHALLENGE_ID, Date>();
	for (let offset = 0; (offset < 365) && (dates.size < CHALLENGE_IDS.length); offset++) {
		const date = dayOffset(base, offset);
		const challenge = pickDailyChallenge(dailyKey(date));
		if (!dates.has(challenge)) {
			dates.set(challenge, date);
		}
	}
	return dates;
}

const CHALLENGE_DATES = findChallengeDates(TODAY);

function buildMonths(today: Date, days: Array<SeedDay>): Record<string, unknown> {
	const months: Record<string, { v: number; days: Record<string, unknown> }> = {};
	for (const day of days) {
		const key = dailyKey(dayOffset(today, day.offset));
		const monthKey = dailyMonthKey(key);
		months[`mah.daily.${monthKey}`] ??= { v: 1, days: {} };
		(months[`mah.daily.${monthKey}`] as { days: Record<string, unknown> }).days[key] = {
			// the stored challenge has to be the one that day actually rotates in, or the best scores list lies
			challenge: pickDailyChallenge(key),
			won: day.won,
			attempts: day.attempts,
			firstTry: day.firstTry,
			playTime: day.playTime,
			score: day.score
		};
	}
	return months;
}

async function useDay(page: Page, date: Date): Promise<void> {
	await page.clock.install({ time: date });
	// only the date is faked - the game clock has to keep ticking for the challenge timers
	await page.clock.resume();
}

async function seedHistory(page: Page, today: Date, days: Array<SeedDay> = HISTORY, best = 9): Promise<void> {
	const entries = { ...buildMonths(today, days), 'mah.daily.meta': { v: 1, streak: 0, best, played: 0, won: 0 } };
	await page.addInitScript(store => {
		for (const [key, value] of Object.entries(store)) {
			localStorage.setItem(key, JSON.stringify(value));
		}
	}, entries);
}

async function openInfoPopup(overlay: Locator, open: () => Promise<void>): Promise<Locator> {
	const popup = overlay.locator('.info-popup');
	await open();
	await expect(popup).toBeVisible({ timeout: 2000 });
	return popup;
}

async function closeInfoPopup(overlay: Locator): Promise<void> {
	const popup = overlay.locator('.info-popup');
	await popup.locator('button.close').click();
	await expect(popup).toBeHidden({ timeout: 2000 });
}

// clicking a finished game away resets the board and reopens the picker
async function dismissMessage(page: Page): Promise<void> {
	const message = page.locator('.overlay-message-message');
	await message.click();
	await expect(page.locator('.overlay-message')).toBeHidden({ timeout: 2000 });
}

// plays the board with the hint key until the game ends: two clicks on the hinted group are always a match
async function autoplay(page: Page, maxRounds = 200): Promise<boolean> {
	const message = page.locator('.overlay-message');
	const hinted = page.locator('g.hinted');
	for (let round = 0; round < maxRounds; round++) {
		if (await message.isVisible()) {
			return true;
		}
		await page.keyboard.press('t');
		const gotHint = await hinted.first().waitFor({ state: 'attached', timeout: 3000 }).then(() => true).catch(() => false);
		if (!gotHint) {
			return message.isVisible();
		}
		// dispatched instead of clicked: a tile of a lower layer can be covered by its neighbours
		await hinted.nth(0).dispatchEvent('mouseup');
		await hinted.nth(1).dispatchEvent('mouseup');
		await page.waitForTimeout(30);
	}
	return message.isVisible();
}

test.describe('daily', () => {
	test('overview without history', async ({ page, baseURL }) => {
		await useDay(page, TODAY);
		await startGame(page, baseURL);
		const overlay = await openDailyChallenge(page);
		await captureDialogScreenshots(page, overlay, 'daily-fresh', SCROLL_TARGET);
	});

	test('overview with history', async ({ page, baseURL }) => {
		await useDay(page, TODAY);
		await seedHistory(page, TODAY);
		await startGame(page, baseURL);
		const overlay = await openDailyChallenge(page);
		await captureDialogScreenshots(page, overlay, 'daily-history', SCROLL_TARGET);

		const title = overlay.locator('.calendar-title');
		const month = await title.textContent();
		await overlay.locator('.calendar-head button').first().click();
		await expect(title).not.toHaveText(month ?? '', { timeout: 2000 });
		await screenshot(page, 'calendar-previous-month');
		await overlay.locator('.calendar-head button').last().click();
		await overlay.locator('.calendar-head button').last().click();
		await expect(title).not.toHaveText(month ?? '', { timeout: 2000 });
		await screenshot(page, 'calendar-next-month');
	});

	test('today already won', async ({ page, baseURL }) => {
		await useDay(page, TODAY);
		await seedHistory(page, TODAY, [
			...HISTORY,
			{ offset: 0, won: true, attempts: 1, firstTry: true, playTime: 87_000, score: 7150 }
		]);
		await startGame(page, baseURL);
		const overlay = await openDailyChallenge(page);
		await expect(overlay.locator('.daily-result')).toBeVisible({ timeout: 2000 });
		await captureDialogScreenshots(page, overlay, 'daily-today-won', SCROLL_TARGET);
	});

	test('today not completed', async ({ page, baseURL }) => {
		await useDay(page, TODAY);
		await seedHistory(page, TODAY, [
			...HISTORY,
			{ offset: 0, won: false, attempts: 4, firstTry: false, score: 1900 }
		]);
		await startGame(page, baseURL);
		const overlay = await openDailyChallenge(page);
		await expect(overlay.locator('.daily-result')).toBeVisible({ timeout: 2000 });
		await captureDialogScreenshots(page, overlay, 'daily-today-lost', SCROLL_TARGET);
	});

	test('info popups', async ({ page, baseURL }) => {
		await useDay(page, TODAY);
		await seedHistory(page, TODAY);
		await startGame(page, baseURL);
		const overlay = await openDailyChallenge(page);

		await openInfoPopup(overlay, async () => overlay.locator('.daily-scores .info-label').click());
		await screenshot(page, 'popup-scoring');
		await closeInfoPopup(overlay);

		const rows = overlay.locator('.score-row');
		for (const [index, challenge] of CHALLENGE_IDS.entries()) {
			const row = rows.nth(index);
			await row.scrollIntoViewIfNeeded();
			await openInfoPopup(overlay, async () => row.click());
			await screenshot(page, `popup-${challengeSlug(challenge)}`);
			await closeInfoPopup(overlay);
		}
	});

	// every challenge as the challenge of the day: its own board, its own facts, its own hud
	for (const [challenge, date] of CHALLENGE_DATES) {
		test(challengeSlug(challenge), async ({ page, baseURL }) => {
			await useDay(page, date);
			await startGame(page, baseURL);
			const overlay = await openDailyChallenge(page);
			await captureDialogScreenshots(page, overlay, 'daily-overview', SCROLL_TARGET);
			await startDailyChallenge(page);
			await screenshot(page, 'challenge-hud');
		});
	}

	test('won play', async ({ page, baseURL }) => {
		test.setTimeout(120_000);
		// Thirty in Three wins on the match count, which hint play reaches long before the board runs dry
		const date = CHALLENGE_DATES.get(CHALLENGE_CODES.CHALLENGE_THIRTY_IN_THREE) ?? TODAY;
		await useDay(page, date);
		await seedHistory(page, date);
		await startGame(page, baseURL);
		await openDailyChallenge(page);
		await startDailyChallenge(page);
		await screenshot(page, 'challenge-hud-running');

		expect(await autoplay(page)).toBe(true);
		await screenshot(page, 'message-won');

		await dismissMessage(page);
		const overlay = await openDailyChallenge(page);
		await expect(overlay.locator('.daily-result.won')).toBeVisible({ timeout: 2000 });
		await captureDialogScreenshots(page, overlay, 'daily-after-win', SCROLL_TARGET);
	});

	test('failed play', async ({ page, baseURL }) => {
		test.setTimeout(120_000);
		// Midas Match has no clock, so hint play ends it by running the board dry with the gold tile still buried
		const date = CHALLENGE_DATES.get(CHALLENGE_CODES.CHALLENGE_MIDAS_MATCH) ?? TODAY;
		await useDay(page, date);
		await seedHistory(page, date);
		await startGame(page, baseURL);
		await openDailyChallenge(page);
		await startDailyChallenge(page);

		expect(await autoplay(page)).toBe(true);
		await screenshot(page, 'message-failed');

		await dismissMessage(page);
		const overlay = await openDailyChallenge(page);
		await expect(overlay.locator('.daily-result:not(.won)')).toBeVisible({ timeout: 2000 });
		await captureDialogScreenshots(page, overlay, 'daily-after-loss', SCROLL_TARGET);
	});

	test('failed play out of time', async ({ page, baseURL }) => {
		const date = CHALLENGE_DATES.get(CHALLENGE_CODES.CHALLENGE_FORTUNE_HUNT) ?? TODAY;
		await useDay(page, date);
		await seedHistory(page, date);
		await startGame(page, baseURL);
		await openDailyChallenge(page);
		await startDailyChallenge(page);

		// the dialog swallows key events, so the paused game is resumed the same way a player does it
		await page.keyboard.press('p');
		await expect(page.locator('.overlay-message')).toBeVisible({ timeout: 2000 });
		await screenshot(page, 'message-paused');
		await dismissMessage(page);

		await page.clock.fastForward('05:00');
		await expect(page.locator('.overlay-message')).toBeVisible({ timeout: 5000 });
		await screenshot(page, 'message-time-up');

		await dismissMessage(page);
		const overlay = await openDailyChallenge(page);
		await expect(overlay.locator('.daily-result:not(.won)')).toBeVisible({ timeout: 2000 });
		await captureDialogScreenshots(page, overlay, 'daily-after-time-up', SCROLL_TARGET);
		await closeOverlay(overlay);
	});
});
