// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import {env} from './env';

export const environment = {
	production: false,
	version: env.APP_VERSION,
	name: env.APP_NAME,
	mobile: env.APP_FEATURE_MOBILE,
	editor: env.APP_FEATURE_EDITOR
};
