import { env } from './env';
import { openUrl } from '@tauri-apps/plugin-opener';

export const environment = {
	production: true,
	version: env.APP_VERSION,
	name: env.APP_NAME,
	mobile: true,
	editor: env.APP_FEATURE_EDITOR,
	kyodai: env.APP_FEATURE_KYODAI,
	modules: [],
	openExternal: openExternal
};

export function openExternal(url: string): void {
	openUrl(url).catch(error => console.error('openUrl failed', error));
}
