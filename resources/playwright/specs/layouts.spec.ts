import { test } from '@playwright/test';
import { loadBoards, ensureOrientation, startLayout, startGame, screenshot, ORIENTATIONS } from './common';

test.describe('layout', () => {
	test.beforeEach(async ({ page, baseURL }, testInfo) => {
		const scheme = testInfo.project.use.colorScheme as 'light' | 'dark' | undefined;
		if (scheme === 'dark') {
			test.skip();
		}
		await startGame(page, baseURL);
	});

	const boards = loadBoards();
	for (const board of boards) {
		for (const orientation of ORIENTATIONS) {
			test(`${board.name.toLowerCase()}-${orientation}`, async ({ page }) => {
				await ensureOrientation(page, orientation);
				await startLayout(page, board.id);
				await screenshot(page, orientation);
			});
		}
	}
});
