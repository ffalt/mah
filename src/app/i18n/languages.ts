import * as LANG_EN from './en.json';
import * as LANG_DE from './de.json';
import * as LANG_NL from './nl.json';
import * as LANG_PT from './pt.json';
import * as LANG_RU from './ru.json';
import * as LANG_ES from './es.json';

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES: { [name: string]: { title: string; data: { [key: string]: string } } } = {
	en: {title: 'English', data: LANG_EN},
	de: {title: 'Deutsch', data: LANG_DE},
	nl: {title: 'Nederlands', data: LANG_NL},
	pt: {title: 'Português', data: LANG_PT},
	ru: {title: 'русский', data: LANG_RU},
	es: {title: 'Español', data: LANG_ES}
};

export const LANGUAGE_TITLES = Object.keys(LANGUAGES).map(key => ({key, title: LANGUAGES[key].title}));
