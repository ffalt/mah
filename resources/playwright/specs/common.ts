import { expect, type Locator, type Page, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

interface BoardDefinition {
	id: string;
	name: string;
	cat: string;
}

export async function screenshot(page: Page, name: string) {
	await test.info().attach(`${name}.png`, { body: await page.screenshot(), contentType: 'image/png' });
}

export async function startGame(page: Page, baseURL: string | undefined = undefined) {
	await page.goto(baseURL ?? '/');
	await page.waitForSelector('.controls-top');
	await page.click('button.tutorial-btn-skip');
}

export function loadLanguagesFromI18n(): Array<string> {
	const folder = path.resolve(__dirname, '../../../src/assets/i18n');
	try {
		const entries = fs.readdirSync(folder, { withFileTypes: true });
		return entries
			.filter(ent => ent.isFile() && ent.name.endsWith('.json'))
			.map(ent => path.basename(ent.name, '.json'))
			.sort();
	} catch (error) {
		console.warn('Failed to read i18n languages, falling back to [en]', error);
		return ['en'];
	}
}

export async function ensureOrientation(page: Page, orientation: 'portrait' | 'landscape') {
	const size = page.viewportSize();
	if (!size) {
		return;
	}
	if (size.height >= size.width && (orientation === 'landscape')) {
		await page.setViewportSize({ width: size.height, height: size.width });
	} else if (size.width >= size.height && (orientation === 'portrait')) {
		await page.setViewportSize({ width: size.height, height: size.width });
	}
}

export async function startFirstLayout(page: Page) {
	const overlay = page.locator('.overlay.overlay-newgame');
	await expect(overlay).toBeVisible({ timeout: 1000 });
	const layout = overlay.locator('.preview').first();
	await layout.scrollIntoViewIfNeeded();
	await layout.click();
	await expect(overlay).toBeHidden({ timeout: 1000 });
}

export async function startLayout(page: Page, layoutID: string) {
	const overlay = page.locator('.overlay.overlay-newgame');
	await expect(overlay).toBeVisible({ timeout: 2000 });
	const layout = overlay.locator(`#item-${layoutID}`);
	await layout.scrollIntoViewIfNeeded();
	await sleep(100);
	await layout.click();
	await expect(overlay).toBeHidden({ timeout: 2000 });
}

export async function openSettingsDialog(page: Page) {
	return openDialog(page, 'button:has(.icon-cog)', 'overlay-settings');
}

export async function openHelpDialog(page: Page) {
	return openDialog(page, 'button:has(.icon-logo)', 'overlay-help');
}

export async function openInfoDialog(page: Page) {
	return openDialog(page, 'button:has(.icon-calendar)', 'overlay-info');
}

export async function openGameDialog(page: Page) {
	return openDialog(page, 'button:has(.icon-loop)', 'overlay-newgame');
}

export async function openDialog(page: Page, buttonSelect: string, overlayClass: string) {
	const overlay = page.locator(`.overlay.${overlayClass}`);
	await expect(overlay).toBeHidden({ timeout: 1000 });
	const button = page.locator(buttonSelect);
	await button.waitFor({ state: 'visible', timeout: 1000 });
	await button.click();
	await expect(overlay).toBeVisible({ timeout: 1000 });
	return overlay;
}

export async function closeOverlay(overlay: Locator) {
	const closeButton = overlay.locator('.overlay-popup .close');
	await closeButton.click();
	await expect(overlay).toBeHidden({ timeout: 1000 });
}

export function loadBoards(): Array<BoardDefinition> {
	const file = path.resolve(__dirname, '../../../src/assets/data/boards.json');
	const raw = fs.readFileSync(file, 'utf8');
	return JSON.parse(raw) as Array<BoardDefinition>;
}

export async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

export const ORIENTATIONS: Array<'portrait' | 'landscape'> = ['portrait', 'landscape'];

export async function setLanguage(page: Page, lang: string) {
	const settingsOverlay = await openSettingsDialog(page);
	const radio = settingsOverlay.locator(`input[name="lang"][value="${lang}"]`).first();
	await radio.waitFor({ state: 'visible', timeout: 1000 });
	await radio.click();
	await closeOverlay(settingsOverlay);
}

export async function setTheme(page: Page, theme: string) {
	const overlaySettings = await openSettingsDialog(page);
	const tabsLabels = overlaySettings.locator('.tabs-labels');
	const hasVisibleTabs = await tabsLabels.isVisible();
	if (hasVisibleTabs) {
		const tabLabel = overlaySettings.locator(`.tabs-labels label[for="tab-theme"]`);
		await tabLabel.waitFor({ state: 'visible' });
		await tabLabel.click();
	}
	const radio = overlaySettings.locator(`input[name="color"][value="${theme}"]`).first();
	await radio.waitFor({ state: 'visible', timeout: 1000 });
	await radio.click();
	return overlaySettings;
}

export async function captureSettingsScreenshots(page: Page) {
	const probeOverlay = await openSettingsDialog(page);
	const tabsLabels = probeOverlay.locator('.tabs-labels');
	const hasVisibleTabs = await tabsLabels.isVisible();
	if (hasVisibleTabs) {
		const inputs = probeOverlay.locator('.tabs-input');
		const count = await inputs.count();
		await closeOverlay(probeOverlay);

		for (let index = 0; index < count; index++) {
			const overlaySettings = await openSettingsDialog(page);
			const input = overlaySettings.locator('.tabs-input').nth(index);
			const tabId = (await input.getAttribute('id')) ?? `tab-${index}`;
			const tabLabel = overlaySettings.locator(`.tabs-labels label[for="${tabId}"]`);
			await tabLabel.waitFor({ state: 'visible' });
			await tabLabel.click();
			await captureDialogScreenshots(page, overlaySettings, `settings-${tabId}`, 'app-settings');
			await closeOverlay(overlaySettings);
		}
	} else {
		await captureDialogScreenshots(page, probeOverlay, 'settings', 'app-settings');
		if (await probeOverlay.isVisible()) {
			await closeOverlay(probeOverlay);
		}
	}
}

export async function captureHelpScreenshots(page: Page) {
	const overlayHelp = await openHelpDialog(page);
	await captureDialogScreenshots(page, overlayHelp, 'help', 'app-help');
	await closeOverlay(overlayHelp);
}

export async function captureInfoScreenshots(page: Page) {
	const overlayInfo = await openInfoDialog(page);
	await captureDialogScreenshots(page, overlayInfo, 'info', '.tiles-content');
	await closeOverlay(overlayInfo);
}

export async function captureDialogScreenshots(page: Page, overlay: Locator, name: string, scrollSelector: string) {
	const overlap = 100;
	const maxShots = 10;
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
	await screenshot(page, `${name}-${shotIndex}`);

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
		await screenshot(page, `${name}-${shotIndex}`);
		if (scrollTop + clientHeight >= scrollHeight - 1) {
			break;
		}
	}
}
