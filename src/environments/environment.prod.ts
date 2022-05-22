import {env} from './env';

export const environment = {
	production: true,
	version: env.APP_VERSION,
	name: env.APP_NAME,
	editor: env.APP_FEATURE_EDITOR
};
