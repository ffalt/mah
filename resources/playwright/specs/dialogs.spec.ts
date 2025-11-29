import { test } from '@playwright/test';
import { captureDialogScreenshots, captureHelpScreenshots, captureInfoScreenshots, captureSettingsScreenshots, ORIENTATIONS, startFirstLayout, startGame } from './common';

test.describe('dialogs', () => {
	test.beforeEach(async ({ page, baseURL }) => {
		await startGame(page, baseURL);
	});

	for (const orientation of ORIENTATIONS) {
		test(orientation, async ({ page }) => {
			const overlay = page.locator('.overlay.overlay-newgame');
			await captureDialogScreenshots(page, overlay, 'game', '.groups');
			await startFirstLayout(page);
			await captureHelpScreenshots(page);
			await captureInfoScreenshots(page);
			await captureSettingsScreenshots(page);
		});
	}
});
