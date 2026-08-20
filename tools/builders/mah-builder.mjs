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

const PLACEHOLDER = /\{\{(APP_[A-Z_]+)}}/g;
const LD_JSON_BLOCK = /<script type="application\/ld\+json">[\S\s]*?<\/script>/;

export function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// JSON string escaping, minus the surrounding quotes; `<` is escaped so a value can never
// close the script element
export function escapeJsonString(value) {
	return JSON.stringify(String(value)).slice(1, -1).replace(/</g, String.raw`\u003c`);
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
		const block = LD_JSON_BLOCK.exec(indexHtml);
		const jsonStart = block ? block.index : -1;
		const jsonEnd = block ? block.index + block[0].length : -1;
		return indexHtml.replace(PLACEHOLDER, (match, key, offset) => {
			if (!(key in values)) {
				return match;
			}
			const inJson = offset >= jsonStart && offset < jsonEnd;
			return inJson ? escapeJsonString(values[key]) : escapeHtml(values[key]);
		});
	};
}

export function buildDefine(config = {}, packageJson = {}) {
	const name = "Mah Jong";
	return {
		APP_VERSION: JSON.stringify(packageJson.version ?? "DEV"),
		APP_NAME: JSON.stringify(config.name ?? name),
		APP_FEATURE_EDITOR: JSON.stringify(!!config.editor),
		APP_FEATURE_KYODAI: JSON.stringify(!!config.kyodai),
		APP_FEATURE_MOBILE: JSON.stringify(!!config.mobile),
		APP_FEATURE_DAILY: JSON.stringify(!!config.daily)
	};
}

// Create an esbuild plugin that injects our define values for development-server builds
export function createDefinePlugin(defineObject) {
	return {
		name: "mah-define",
		setup(build) {
			if (!build.initialOptions.define) {
				build.initialOptions.define = {};
			}
			const defs = build.initialOptions.define;
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
		// Provide build plugins so the development-server path passes them as codePlugins internally
		buildPlugins: [createDefinePlugin(define)]
	};
	return { define, extensions };
}
