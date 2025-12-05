import fs from "node:fs";
import path from "node:path";

function loadJsonIfExists(filePath) {
	try {
		if (fs.existsSync(filePath)) {
			return JSON.parse(fs.readFileSync(filePath, "utf8"));
		}
	} catch {
		// ignore
	}
	return undefined;
}

export function createIndexHtmlTransformer(config = {}) {
	const fallback = "Mah Jong";
	const values = {
		APP_NAME: config.name ?? fallback,
		APP_DESC: config.description ?? fallback,
		APP_CAT: config.category ?? fallback,
		APP_TITLE: config.title ?? fallback,
		APP_URL: config.url ?? ""
	};
	return async function indexHtmlTransformer(indexHtml) {
		let out = indexHtml;
		for (const [key, value] of Object.entries(values)) {
			out = out.replace(new RegExp(key, "g"), String(value));
		}
		return out;
	};
}

export function buildDefine(config = {}, packageJson = {}) {
	const name = "Mah Jong";
	return {
		APP_VERSION: JSON.stringify(packageJson.version ?? "DEV"),
		APP_NAME: JSON.stringify(config.name ?? name),
		APP_FEATURE_EDITOR: JSON.stringify(!!config.editor),
		APP_FEATURE_KYODAI: JSON.stringify(!!config.kyodai),
		APP_FEATURE_MOBILE: JSON.stringify(!!config.mobile)
	};
}

// Create an esbuild plugin that injects our define values for dev-server builds
export function createDefinePlugin(defineObject) {
	return {
		name: "mah-define",
		setup(build) {
			const defs = build.initialOptions.define || (build.initialOptions.define = {});
			for (const [k, v] of Object.entries(defineObject)) {
				defs[k] = v;
			}
		}
	};
}

export function mahBuild(options, context) {
	const root = context.workspaceRoot ?? process.cwd();
	const configPath = path.join(root, "custom-build-config.json");
	const config = loadJsonIfExists(configPath) ?? {};
	const packageJson = loadJsonIfExists(path.join(root, "package.json")) ?? {};
	const define = {
		...options.define,
		...buildDefine(config, packageJson)
	};
	const extensions = {
		indexHtmlTransformer: createIndexHtmlTransformer(config),
		// Provide build plugins so the dev-server path passes them as codePlugins internally
		buildPlugins: [createDefinePlugin(define)]
	};
	return { define, extensions };
}
