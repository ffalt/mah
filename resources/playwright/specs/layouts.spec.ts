import { test, expect, Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

interface BoardDefinition {
	id: string;
	name: string;
	cat: string;
}

function loadBoards(): Array<BoardDefinition> {
	const file = path.resolve(__dirname, '../../../src/assets/data/boards.json');
	const raw = fs.readFileSync(file, 'utf8');
	return JSON.parse(raw) as Array<BoardDefinition>;
}

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

const boards = loadBoards();

test.describe('board', () => {
	test.beforeEach(async ({ page, baseURL }, testInfo) => {
		// Skip these tests entirely when running with a dark color scheme
		const scheme = testInfo.project.use.colorScheme as 'light' | 'dark' | undefined;
		if (scheme === 'dark') {
			test.skip();
		}

		await page.goto(baseURL ?? '/');
		await page.waitForSelector('.controls-top');
	});

	for (const board of boards) {
		test(board.name.toLowerCase(), async ({ page }) => {
			const overlay = page.locator('.overlay.overlay-newgame');
			await expect(overlay).toBeVisible({ timeout: 1000 });

			const target = overlay.locator(`#item-${board.id}`);
			const item = target.first();
			await item.scrollIntoViewIfNeeded();
			await sleep(300);
			await item.click();
			await expect(overlay).toBeHidden({ timeout: 2000 });

			const firstBuffer = await page.screenshot();
			await test.info().attach('part-1.png', { body: firstBuffer, contentType: 'image/png' });

			const size = page.viewportSize();
			await page.setViewportSize({ width: size!.height, height: size!.width });
			const secondBuffer = await page.screenshot();
			await test.info().attach('part-2.png', { body: secondBuffer, contentType: 'image/png' });
		});
	}
});
