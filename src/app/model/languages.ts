export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_ALIASES: Record<string, string> = {
	nb: 'no',
	nn: 'no',
	tl: 'fil'
};

export const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar', 'fa', 'ur']);

export function isRTLLanguage(lang: string): boolean {
	return RTL_LANGUAGES.has(lang);
}
export const LANGUAGES: { [name: string]: string } = {
	en: 'English',
	ar: 'العربية',
	bn: 'বাংলা',
	ca: 'Català',
	cs: 'Čeština',
	da: 'Dansk',
	de: 'Deutsch',
	el: 'Ελληνικά',
	es: 'Español',
	eu: 'Euskara',
	fa: 'فارسی',
	fi: 'Suomi',
	fil: 'Filipino',
	fr: 'Français',
	hi: 'हिन्दी',
	hu: 'Magyar',
	id: 'Bahasa Indonesia',
	it: 'Italiano',
	ja: '日本語',
	ko: '한국어',
	ms: 'Bahasa Melayu',
	nl: 'Nederlands',
	no: 'Norsk',
	pl: 'Polski',
	pt: 'Português',
	ro: 'Română',
	ru: 'русский',
	sv: 'Svenska',
	sw: 'Kiswahili',
	ta: 'தமிழ்',
	te: 'తెలుగు',
	th: 'ไทย',
	tr: 'Türkçe',
	uk: 'Українська',
	ur: 'اردو',
	vi: 'Tiếng Việt',
	zh: '中文'
};
