const fs = require('fs');
const webpack = require('webpack');
const pkg = require('./package.json');
let appName = 'Mah Jong';
let editor = false;
let mobile = false;
let kyodai = false;
if (fs.existsSync('./custom-build-config.json')) {
	const config = JSON.parse(fs.readFileSync('./custom-build-config.json').toString());
	appName = config.name || appName;
	editor = !!config.editor;
	kyodai = !!config.kyodai;
	mobile = !!config.mobile;
}

function customBuildOptions(config) {
	config.plugins.push(
		new webpack.DefinePlugin({
			APP_VERSION: JSON.stringify(pkg.version),
			APP_NAME: JSON.stringify(appName),
			APP_FEATURE_EDITOR: JSON.stringify(editor),
			APP_FEATURE_KYODAI: JSON.stringify(kyodai),
			APP_FEATURE_MOBILE: JSON.stringify(mobile)
		})
	);
	return config;
}

module.exports = customBuildOptions;
