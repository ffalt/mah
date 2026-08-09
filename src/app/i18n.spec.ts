import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const i18nDir = path.join(__dirname, '..', 'assets', 'i18n');
const pluralCategories: Array<Intl.LDMLPluralRule> = ['zero', 'one', 'two', 'few', 'many'];

const splitPluralVariant = (key: string, keys: Array<string>): { base: string; category: Intl.LDMLPluralRule } | undefined => {
	const category = pluralCategories.find(c => key.endsWith(`_${c.toUpperCase()}`));
	if (!category) {
		return undefined;
	}
	const base = key.slice(0, -(category.length + 1));
	return keys.includes(base) ? { base, category } : undefined;
};

describe('i18n translations', () => {
	const enData = JSON.parse(fs.readFileSync(path.join(i18nDir, 'en.json'), 'utf8')) as Record<string, string>;
	const enKeys = Object.keys(enData);
	const requiredKeys = enKeys.filter(key => !splitPluralVariant(key, enKeys));
	const files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json') && f !== 'en.json');

	for (const file of files) {
		const lang = file.replace('.json', '');
		it(`${lang} has all keys from en.json`, () => {
			const translations = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8')) as Record<string, string>;
			const missingKeys = requiredKeys.filter(key => !(key in translations));
			expect(missingKeys).toEqual([]);
		});
	}

	for (const file of [...files, 'en.json']) {
		const lang = file.replace('.json', '');
		it(`${lang} only uses plural forms its language has`, () => {
			const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8')) as Record<string, string>);
			const supported = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
			const unusable = keys
				.map(key => splitPluralVariant(key, keys))
				.filter(variant => variant && !supported.includes(variant.category))
				.map(variant => `${variant?.base}_${variant?.category.toUpperCase()}`);
			expect(unusable).toEqual([]);
		});
	}
});
