import { test, expect, Page } from '@playwright/test';

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

async function captureDialogScreenshots(page: Page, overlaySelector: string, scrollSelector: string) {
	const overlap = 100;
	const maxShots = 10;
	const overlay = page.locator(overlaySelector);
	await expect(overlay).toBeVisible();
	const popup = overlay.locator('.overlay-popup');
	const target = (await popup.count()) ? popup : overlay;
	const rootHandle = await target.elementHandle();
	if (!rootHandle) {
		return;
	}

	const providedLocator = target.locator(scrollSelector);
	const scrollElement = await providedLocator.elementHandle();

	async function getMetrics() {
		return page.evaluate(element => ({
			scrollTop: element!.scrollTop,
			clientHeight: element!.clientHeight,
			scrollHeight: element!.scrollHeight
		}), scrollElement);
	}

	await sleep(20);

	let shotIndex = 1;
	const firstBuffer = await page.screenshot();
	await test.info().attach(`part-${shotIndex}.png`, { body: firstBuffer, contentType: 'image/png' });

	let { scrollTop, clientHeight, scrollHeight } = await getMetrics();
	if (scrollHeight <= clientHeight + 2) {
		return;
	}
	for (let index = 0; index < maxShots - 1; index++) {
		const nextTop = Math.min(scrollHeight - clientHeight, scrollTop + Math.max(0, clientHeight - overlap));
		if (nextTop <= scrollTop + 1) {
			break;
		}
		await page.evaluate(arguments_ => {
			arguments_.el!.scrollTo({ top: arguments_.top, behavior: 'auto' });
		}, { el: scrollElement, top: nextTop });
		await sleep(20);
		({ scrollTop, clientHeight, scrollHeight } = await getMetrics());
		shotIndex += 1;
		const buf = await page.screenshot();
		await test.info().attach(`part-${shotIndex}.png`, { body: buf, contentType: 'image/png' });

		if (scrollTop + clientHeight >= scrollHeight - 1) {
			break;
		}
	}

	const close = overlay.locator('.overlay-popup .close');
	await close.click();
	await expect(overlay).toBeHidden();
}

async function openDialog(page: Page, buttonSelect: string, overlayClass: string) {
	const overlay = page.locator(`.overlay.${overlayClass}`);
	await expect(overlay).toBeHidden({ timeout: 1000 });
	const button = page.locator(buttonSelect);
	await button.waitFor({ state: 'visible', timeout: 1000 });
	await button.click();
	await expect(overlay).toBeVisible({ timeout: 1000 });
}

async function startGame(page: Page) {
	const overlay = page.locator('.overlay.overlay-newgame');
	const firstPreview = overlay.locator('.preview').first();
	await firstPreview.click();
	await expect(overlay).toBeHidden({ timeout: 1000 });
}

test.beforeEach(async ({ page, baseURL }) => {
	await page.goto(baseURL ?? '/');
	await page.waitForSelector('.controls-top');
	await startGame(page);
});

test('help', async ({ page }) => {
	await openDialog(page, 'button:has(.icon-logo)', 'overlay-help');
	await captureDialogScreenshots(page, '.overlay.overlay-help', 'app-help');
});

test('settings', async ({ page }) => {
	await openDialog(page, 'button:has(.icon-cog)', 'overlay-settings');
	await captureDialogScreenshots(page, '.overlay.overlay-settings', 'app-settings');
});

test('tiles', async ({ page }) => {
	await openDialog(page, 'button:has(.icon-calendar)', 'overlay-info');
	await captureDialogScreenshots(page, '.overlay.overlay-info', '.tiles-content');
});

test('game', async ({ page }) => {
	await openDialog(page, 'button:has(.icon-loop)', 'overlay-newgame');
	await captureDialogScreenshots(page, '.overlay.overlay-newgame', '.groups');
});
