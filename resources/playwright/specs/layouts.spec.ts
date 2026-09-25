import { test } from '@playwright/test';
import { loadLayouts, ensureOrientation, startLayout, startGame, screenshot, ORIENTATIONS } from './common';

test.describe('layout', () => {
	test.beforeEach(async ({ page, baseURL }, testInfo) => {
		const scheme = testInfo.project.use.colorScheme as 'light' | 'dark' | undefined;
		if (scheme === 'dark') {
			test.skip();
			return;
		}
		await startGame(page, baseURL);
	});

	const layouts = loadLayouts();
	for (const layout of layouts) {
		for (const orientation of ORIENTATIONS) {
			test(`${layout.name.toLowerCase()}-${orientation}`, async ({ page }) => {
				await ensureOrientation(page, orientation);
				await startLayout(page, layout.id);
				await screenshot(page, orientation);
			});
		}
	}
});
