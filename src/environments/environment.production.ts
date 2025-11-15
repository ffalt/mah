import { env } from './env';

export const environment = {
	production: true,
	version: env.APP_VERSION,
	name: env.APP_NAME,
	mobile: env.APP_FEATURE_MOBILE,
	editor: env.APP_FEATURE_EDITOR,
	kyodai: env.APP_FEATURE_KYODAI,
	modules: [],
	openExternal: undefined
};
