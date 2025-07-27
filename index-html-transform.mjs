import fs from "node:fs";

export default async function customBuildOptions(targetOptions, indexHtmlContent) {
	const name = "Mah Jong";
	let config = {};
	if (fs.existsSync("./custom-build-config.json")) {
		config = JSON.parse(fs.readFileSync("./custom-build-config.json").toString());
	}
	return indexHtmlContent
		.replace(/APP_NAME/g, config.name || name)
		.replace(/APP_DESC/g, config.description || name)
		.replace(/APP_CAT/g, config.category || name)
		.replace(/APP_TITLE/g, config.title || name)
		.replace(/APP_URL/g, config.url || "");
}
