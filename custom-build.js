// import {CustomWebpackBrowserSchema, TargetOptions} from '@angular-builders/custom-webpack';
var fs = require('fs');
var webpack = require('webpack');
var pkg = require('./package.json');
var appName = 'Mah Jong';
var editor = false;
if (fs.existsSync('./custom-build-config.json')) {
	var config = JSON.parse(fs.readFileSync('./custom-build-config.json').toString());
	appName = config.name || appName;
	editor = !!config.editor;
}

function customBuildOptions(config, options, targetOptions) {
	config.plugins.push(
		new webpack.DefinePlugin({
			APP_VERSION: JSON.stringify(pkg.version),
			APP_NAME: JSON.stringify(appName),
			APP_FEATURE_EDITOR: JSON.stringify(editor)
		})
	);
	return config;
}

module.exports = customBuildOptions;
