import { env } from './env';
import { openUrl } from '@tauri-apps/plugin-opener';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export const environment = {
	production: true,
	version: env.APP_VERSION,
	name: env.APP_NAME,
	mobile: true,
	editor: env.APP_FEATURE_EDITOR,
	kyodai: env.APP_FEATURE_KYODAI,
	modules: [],
	openExternal: openExternal,
	onWindowBlur: onWindowBlur
};

export function openExternal(url: string): void {
	openUrl(url).catch(error => console.error('openUrl failed', error));
}

let _tauriUnlistenBlur: UnlistenFn | undefined;

export function onWindowBlur(callback: () => void): void {
	// eslint-disable-next-line no-void
	void listen('tauri://blur', () => {
		callback();
	}).then(un => {
		_tauriUnlistenBlur = un;
	}).catch(error => console.error(error));
}
