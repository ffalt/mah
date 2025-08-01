import fs from 'node:fs';

const indexHtmlTransform = (indexHtml: string): string => {
	const name = 'Mah Jong';
	let config: { [key: string]: string | undefined } = {};
	const filenameJSON = './custom-build-config.json';
	if (fs.existsSync(filenameJSON)) {
		config = JSON.parse(fs.readFileSync(filenameJSON).toString());
	}
	return indexHtml
		.replace(/APP_NAME/g, config.name ?? name)
		.replace(/APP_DESC/g, config.description ?? name)
		.replace(/APP_CAT/g, config.category ?? name)
		.replace(/APP_TITLE/g, config.title ?? name)
		.replace(/APP_URL/g, config.url ?? '');
};
export default indexHtmlTransform;
