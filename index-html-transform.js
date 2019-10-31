const fs = require('fs');

async function customBuildOptions(targetOptions, indexHtmlContent) {
	let appName = 'Mah Jong';
	if (fs.existsSync('./custom-build-config.json')) {
		const config = JSON.parse(fs.readFileSync('./custom-build-config.json').toString());
		appName = config.name || appName;
	}
	return indexHtmlContent.replace(/APP_NAME/g, appName);
}

module.exports = customBuildOptions;
