import * as LANG_EN from './en.json';
import * as LANG_DE from './de.json';
import * as LANG_NL from './nl.json';
import * as LANG_PT from './pt.json';
import * as LANG_RU from './ru.json';
import * as LANG_ES from './es.json';
import * as LANG_EU from './eu.json';
import * as LANG_JP from './jp.json';
import * as LANG_FR from './fr.json';

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES: { [name: string]: { title: string; data: { [key: string]: string } } } = {
	en: {title: 'English', data: LANG_EN},
	de: {title: 'Deutsch', data: LANG_DE},
	nl: {title: 'Nederlands', data: LANG_NL},
	pt: {title: 'Português', data: LANG_PT},
	ru: {title: 'русский', data: LANG_RU},
	es: {title: 'Español', data: LANG_ES},
	eu: {title: 'Euskara', data: LANG_EU},
	jp: {title: '日本語', data: LANG_JP},
	fr: {title: 'Français', data: LANG_FR}
};

export const LANGUAGE_TITLES = Object.keys(LANGUAGES).map(key => ({key, title: LANGUAGES[key].title}));
