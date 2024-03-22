import {CapacitorModule} from '../../resources/mobile/src/capacitor.module';
import {env} from './env';

export const environment = {
	production: true,
	version: env.APP_VERSION,
	name: env.APP_NAME,
	mobile: true,
	editor: env.APP_FEATURE_EDITOR,
	kyodai: env.APP_FEATURE_KYODAI,
	modules: [CapacitorModule.forRoot()]
};
