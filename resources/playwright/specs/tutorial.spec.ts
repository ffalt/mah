import { test } from '@playwright/test';
import {
	ORIENTATIONS,
	ensureOrientation,
	loadLanguagesFromI18n,
	setLanguage, startGame, openHelpDialog, startFirstLayout, screenshot
} from './common';

test.describe('tutorial', () => {
	test.beforeEach(async ({ page, baseURL }) => {
		await startGame(page, baseURL);
		await startFirstLayout(page);
	});

	const LANGUAGES = loadLanguagesFromI18n();
	for (const lang of LANGUAGES) {
		for (const orientation of ORIENTATIONS) {
			test(`${lang}-${orientation}`, async ({ page }) => {
				await ensureOrientation(page, orientation);
				await setLanguage(page, lang);

				const overlayHelp = await openHelpDialog(page);
				await overlayHelp.locator('a.tutorial-link').click();

				const overlay = page.locator('.overlay.overlay-tutorial');
				await overlay.waitFor({ state: 'visible', timeout: 2000 });
				const tutorial = overlay.locator('app-tutorial');

				// Screenshot welcome screen
				await screenshot(page, 'tutorial-0');

				// Click start button
				await tutorial.locator('button.tutorial-btn-primary').click();
				await page.waitForTimeout(500);

				const TUTORIAL_STEPS = 5;
				const nextButton = tutorial.locator('button.tutorial-btn-next');

				// Iterate through each tutorial step
				for (let index = 0; index <= TUTORIAL_STEPS; index++) {
					await page.evaluate(() => {
						document.querySelector('button.tutorial-btn-next')?.setAttribute('style', 'display: hidden');
					});

					await screenshot(page, `tutorial-${index + 1}`);

					// Click next button if not the last step
					if (index < TUTORIAL_STEPS) {
						await page.evaluate(() => {
							document.querySelector('button.tutorial-btn-next')?.setAttribute('style', 'display: block');
						});
						await nextButton.click();
						await page.waitForTimeout(500);
					}
				}
			});
		}
	}
});
