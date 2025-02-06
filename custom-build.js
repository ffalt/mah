const fs = require('fs');
const webpack = require('webpack');
const pkg = require('./package.json');

function customBuildOptions(config) {
	let conf = {};
	if (fs.existsSync('./custom-build-config.json')) {
		conf = JSON.parse(fs.readFileSync('./custom-build-config.json').toString());
	}
	config.plugins.push(
		new webpack.DefinePlugin({
			APP_VERSION: JSON.stringify(pkg.version),
			APP_NAME: JSON.stringify(conf.name || 'Mah Jong'),
			APP_FEATURE_EDITOR: JSON.stringify(!!conf.editor),
			APP_FEATURE_KYODAI: JSON.stringify(!!conf.kyodai),
			APP_FEATURE_MOBILE: JSON.stringify(!!conf.mobile)
		})
	);
	return config;
}

module.exports = customBuildOptions;
