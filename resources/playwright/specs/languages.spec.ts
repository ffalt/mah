import { test } from '@playwright/test';
import {
	ORIENTATIONS,
	captureHelpScreenshots,
	captureInfoScreenshots,
	captureSettingsScreenshots,
	ensureOrientation,
	loadLanguagesFromI18n,
	screenshot,
	setLanguage,
	startFirstLayout,
	startGame
} from './common';

test.describe('languages', () => {
	test.beforeEach(async ({ page, baseURL }, testInfo) => {
		const scheme = testInfo.project.use.colorScheme as 'light' | 'dark' | undefined;
		if (scheme === 'dark') {
			test.skip();
			return;
		}
		await startGame(page, baseURL);
	});

	const LANGUAGES = loadLanguagesFromI18n();
	for (const lang of LANGUAGES) {
		for (const orientation of ORIENTATIONS) {
			test(`${lang}-${orientation}`, async ({ page }) => {
				await ensureOrientation(page, orientation);
				await startFirstLayout(page);
				await setLanguage(page, lang);
				await captureHelpScreenshots(page);
				await captureInfoScreenshots(page);
				await captureSettingsScreenshots(page);
				await screenshot(page, 'layout');
			});
		}
	}
});
