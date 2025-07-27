import fs from "node:fs";
import webpack from "webpack";
import packageJSON from "./package.json" with { type: "json" };

export default function customBuildOptions(config) {
	let data = {};
	if (fs.existsSync("./custom-build-config.json")) {
		data = JSON.parse(fs.readFileSync("./custom-build-config.json").toString());
	}
	config.plugins.push(
		new webpack.DefinePlugin({
			APP_VERSION: JSON.stringify(packageJSON.version),
			APP_NAME: JSON.stringify(data.name || "Mah Jong"),
			APP_FEATURE_EDITOR: JSON.stringify(!!data.editor),
			APP_FEATURE_KYODAI: JSON.stringify(!!data.kyodai),
			APP_FEATURE_MOBILE: JSON.stringify(!!data.mobile)
		})
	);
	return config;
}
