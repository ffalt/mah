import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const i18nDirectory = path.join(__dirname, '..', 'assets', 'i18n');
const editorDirectory = path.join(i18nDirectory, 'editor');
const pluralCategories: Array<Intl.LDMLPluralRule> = ['zero', 'one', 'two', 'few', 'many'];

const splitPluralVariant = (key: string, keys: Array<string>): { base: string; category: Intl.LDMLPluralRule } | undefined => {
	const category = pluralCategories.find(c => key.endsWith(`_${c.toUpperCase()}`));
	if (!category) {
		return undefined;
	}
	const base = key.slice(0, -(category.length + 1));
	return keys.includes(base) ? { base, category } : undefined;
};

const readBundle = (directory: string, file: string): Record<string, string> =>
	JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as Record<string, string>;

const listBundles = (directory: string): Array<string> =>
	fs.readdirSync(directory, { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.json'))
		.map(entry => entry.name)
		.sort((a, b) => a.localeCompare(b));

// A plural base and its _ONE/_OTHER variants must never end up in different bundles,
// otherwise splitPluralVariant stops recognising them as variants.
const expectCompleteBundle = (directory: string): void => {
	const enKeys = Object.keys(readBundle(directory, 'en.json'));
	const requiredKeys = enKeys.filter(key => !splitPluralVariant(key, enKeys));
	const files = listBundles(directory).filter(f => f !== 'en.json');

	for (const file of files) {
		const lang = file.replace('.json', '');
		it(`${lang} has all keys from en.json`, () => {
			const missingKeys = requiredKeys.filter(key => !(key in readBundle(directory, file)));
			expect(missingKeys).toEqual([]);
		});
	}

	for (const file of [...files, 'en.json']) {
		const lang = file.replace('.json', '');
		it(`${lang} only uses plural forms its language has`, () => {
			const keys = Object.keys(readBundle(directory, file));
			const supported = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
			const unusable = keys
				.map(key => splitPluralVariant(key, keys))
				.filter(variant => variant && !supported.includes(variant.category))
				.map(variant => `${variant?.base}_${variant?.category.toUpperCase()}`);
			expect(unusable).toEqual([]);
		});
	}
};

describe('i18n translations', () => {
	expectCompleteBundle(i18nDirectory);
});

describe('i18n editor translations', () => {
	expectCompleteBundle(editorDirectory);
});

describe('i18n bundle split', () => {
	it('has an editor bundle for every language', () => {
		expect(listBundles(editorDirectory)).toEqual(listBundles(i18nDirectory));
	});

	for (const file of listBundles(i18nDirectory)) {
		const lang = file.replace('.json', '');
		it(`${lang} keeps EDITOR_ keys out of the main bundle`, () => {
			expect(Object.keys(readBundle(i18nDirectory, file)).filter(key => key.startsWith('EDITOR_'))).toEqual([]);
		});
		it(`${lang} keeps only EDITOR_ keys in the editor bundle`, () => {
			expect(Object.keys(readBundle(editorDirectory, file)).filter(key => !key.startsWith('EDITOR_'))).toEqual([]);
		});
	}
});
