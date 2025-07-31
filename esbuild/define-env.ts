import type { Plugin, PluginBuild } from 'esbuild';
import fs from 'node:fs';

function defineEnv(): Plugin {
	return {
		name: 'define-env',
		setup(build: PluginBuild) {
			let config: { [key: string]: string | boolean | undefined } = {};
			const filenameJSON = './custom-build-config.json';
			if (fs.existsSync(filenameJSON)) {
				config = JSON.parse(fs.readFileSync(filenameJSON).toString());
			}
			let packageJSON: { version?: string } = {};
			const filenamePackage = './package.json';
			if (fs.existsSync(filenamePackage)) {
				packageJSON = JSON.parse(fs.readFileSync(filenamePackage).toString());
			}
			const buildOptions = build.initialOptions;
			if (buildOptions.define) {
				buildOptions.define.APP_VERSION = JSON.stringify(packageJSON.version);
				buildOptions.define.APP_NAME = JSON.stringify(config.name || 'Mah Jong');
				buildOptions.define.APP_FEATURE_EDITOR = JSON.stringify(!!config.editor);
				buildOptions.define.APP_FEATURE_KYODAI = JSON.stringify(!!config.kyodai);
				buildOptions.define.APP_FEATURE_MOBILE = JSON.stringify(!!config.mobile);
			}
		}
	};
}

export default defineEnv;
