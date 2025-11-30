import { test } from '@playwright/test';
import {
	closeOverlay,
	screenshot,
	setTheme,
	startFirstLayout,
	startGame
} from './common';
import { Themes } from '../../../src/app/model/consts';

test.describe('themes', () => {
	test.beforeEach(async ({ page, baseURL }, testInfo) => {
		const name = testInfo.project.name;
		const isDesktop = name.startsWith('desktop-');
		if (!isDesktop) {
			test.skip();
			return;
		}
		await startGame(page, baseURL);
	});

	for (const theme of Themes) {
		test(theme.id, async ({ page }) => {
			await startFirstLayout(page);
			const overlay = await setTheme(page, theme.id);
			await screenshot(page, 'theme');
			await closeOverlay(overlay);
		});
	}
});
