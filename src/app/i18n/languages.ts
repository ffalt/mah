import * as LANG_EN from './en.json';
import * as LANG_DE from './de.json';
import * as LANG_PT from './pt.json';
import * as LANG_RU from './ru.json';

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES: { [name: string]: any } = {
	en: {title: 'English', data: LANG_EN},
	de: {title: 'Deutsch', data: LANG_DE},
	pt: {title: 'Português', data: LANG_PT},
	ru: {title: 'русский', data: LANG_RU},
};

export const LANGUAGE_TITLES = Object.keys(LANGUAGES).map(key => ({key, title: LANGUAGES[key].title}));
