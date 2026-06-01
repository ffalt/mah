import fs from 'node:fs';
import path from 'node:path';

const i18nDir = path.join(__dirname, '..', 'assets', 'i18n');

describe('i18n translations', () => {
	const enData = JSON.parse(fs.readFileSync(path.join(i18nDir, 'en.json'), 'utf8')) as Record<string, string>;
	const enKeys = Object.keys(enData);
	const files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json') && f !== 'en.json').sort();

	for (const file of files) {
		const lang = file.replace('.json', '');
		it(`${lang} has all keys from en.json`, () => {
			const translations = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8')) as Record<string, string>;
			const missingKeys = enKeys.filter(key => !(key in translations));
			expect(missingKeys).toEqual([]);
		});
	}
});
