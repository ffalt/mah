import fs from "node:fs";
import path from "node:path";

const fsp = fs.promises;

function sanitizeSegment(s) {
	return s
		.replace(/[^a-zA-Z0-9._-]+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "")
		.slice(0, 120);
}

async function removeEmptyParents(startPath, stopPath) {
	try {
		let directory = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);
		const stop = path.resolve(stopPath);
		while (directory && path.resolve(directory) !== stop) {
			// Avoid escaping the filesystem root
			const parent = path.dirname(directory);
			if (!parent || parent === directory) {
				break;
			}

			try {
				const entries = await fsp.readdir(directory);
				if (entries.length > 0) {
					break; // not empty -> stop
				}
				await fsp.rmdir(directory);
			} catch {
				// Can't read/remove -> stop cleanup on this branch
				break;
			}
			directory = parent;
		}
	} catch {
		// Ignore cleanup errors entirely
	}
}

async function removeEmptyDirectoriesUnder(root) {
	async function walk(directory) {
		let entries;
		try {
			entries = await fsp.readdir(directory, { withFileTypes: true });
		} catch {
			return false; // can't read; treat as non-empty to be safe
		}
		// Recurse into subdirectories first
		let allChildrenRemovedOrFiles = true;
		for (const ent of entries) {
			if (ent.isDirectory()) {
				const sub = path.join(directory, ent.name);
				const removed = await walk(sub);
				if (!removed) {
					allChildrenRemovedOrFiles = false;
				}
			} else {
				allChildrenRemovedOrFiles = false; // files make the directory non-empty
			}
		}
		if (directory === root) {
			return false;
		} // never remove the root
		if (allChildrenRemovedOrFiles) {
			try {
				await fsp.rmdir(directory);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	}

	await walk(root).catch(() => {
	});
}

async function makeFlatTargetPath(outputDirectory, parts, extension, preferredBase) {
	const base = sanitizeSegment(preferredBase || parts.filter(Boolean).map(element => sanitizeSegment(element)).join("-")) || "attachment";
	const finalExtension = extension && extension.startsWith(".") ? extension : (extension ? `.${extension}` : "");
	let candidate = path.join(outputDirectory, `${base}${finalExtension}`);
	let index = 1;
	while (fs.existsSync(candidate)) {
		index += 1;
		candidate = path.join(outputDirectory, `${base}-${index}${finalExtension}`);
	}
	return candidate;
}

class FlatScreenshotsReporter {
	onBegin(config) {
		this.config = config;
		// Prefer the top-level outputDir (per-run dated folder in our config)
		this.outputDir = config.outputDir || path.resolve(process.cwd(), "results");
		// Build a quick lookup for per-project outputDirs so artifacts land in the right
		// run folder even if Playwright uses project-specific subdirs.
		this.projectOutDirs = new Map();
		for (const proj of config.projects || []) {
			const name = proj.name;
			// Playwright resolves project.outputDir to an absolute path.
			const pOut = proj.outputDir || this.outputDir;
			if (name) {
				this.projectOutDirs.set(name, pOut);
			}
		}
		// Remember marker path so we can remove it onEnd (see playwright.config getStableRunSubdir)
		try {
			const resultsRoot = path.join(process.cwd(), "results");
			this._runIdMarker = path.join(resultsRoot, ".pw-run-id");
		} catch {
			this._runIdMarker = undefined;
		}
	}

	// eslint-disable-next-line complexity
	async onTestEnd(test, result) {
		// Prefer the specific project's outputDir when available; fall back to the
		// global outputDir. This ensures files go into the per-run dated folder.
		const projectName = test.parent?.project()?.name || test.project?.name || "";
		const outDirectory = (projectName && this.projectOutDirs?.get(projectName)) || this.outputDir;
		if (!outDirectory) {
			return;
		}

		const specFile = test.location?.file || (test.titlePath?.()[0] ?? "spec");
		const specBase = sanitizeSegment(path.basename(specFile));
		const rawTitlePath = typeof test.titlePath === "function" ? test.titlePath() : (test.titlePath || []);
		const normalizedTitleSegments = (Array.isArray(rawTitlePath) ? rawTitlePath : [])
			.map(p => sanitizeSegment(path.basename(String(p))))
			.filter(Boolean)
			.filter(seg => seg !== specBase && seg !== (projectName || ""));

		// Collapse duplicates while preserving order
		const seen = new Set();
		const dedupedTitleSegments = [];
		for (const seg of normalizedTitleSegments) {
			if (!seen.has(seg)) {
				seen.add(seg);
				dedupedTitleSegments.push(seg);
			}
		}

		const testTitle = sanitizeSegment(dedupedTitleSegments.join("-")) || sanitizeSegment(test.title);

		for (const att of result.attachments || []) {
			const isImage = (att.contentType && att.contentType.startsWith("image/")) || /\.png$/i.test(att.name || "");
			if (!isImage) {
				continue;
			}

			// Case 1: has a file path (built-in screenshot)
			if (att.path) {
				try {
					const relative = path.relative(outDirectory, att.path);
					const relativeParts = relative.split(path.sep).filter(Boolean);
					// Use only the final segment (original filename without extension) to avoid
					// duplicating project/spec names which are already included above.
					const relativeName = relativeParts.length > 0 ? path.parse(relativeParts.at(-1)).name : undefined;
					// Build filename parts and remove duplicates across the full list
					const parts = [projectName, testTitle, sanitizeSegment(relativeName || "")].filter(Boolean);
					const partsSeen = new Set();
					const ordered = [];
					for (const p of parts) {
						if (!partsSeen.has(p)) {
							partsSeen.add(p);
							ordered.push(p);
						}
					}
					const preferredBase = ordered.join("-");
					const extension = path.extname(att.path) || ".png";
					const target = await makeFlatTargetPath(outDirectory, [], extension, preferredBase);

					await fsp.mkdir(path.dirname(target), { recursive: true });
					await fsp.rename(att.path, target).catch(async error => {
						// Cross-device move fallback: copy + unlink
						if (error && error.code === "EXDEV") {
							await fsp.copyFile(att.path, target);
							await fsp.unlink(att.path);
						} else {
							throw error;
						}
					});
					// Attempt to clean up any now-empty source directories up to outDir
					try {
						const sourceDirectory = path.dirname(att.path);
						await removeEmptyParents(sourceDirectory, outDirectory);
					} catch {
						// ignore cleanup errors
					}
				} catch (error) {
					console.warn(`[flat-screenshots-reporter] Could not move screenshot ${att.path}:`, error?.message || error);
				}
				continue;
			}

			// Case 2: body-only attachment; write it to a new file
			if (att.body) {
				try {
					// Determine extension only once and strip it from the preferred base name
					const parsed = path.parse(att.name || "attachment");
					const hasPng = att.contentType === "image/png" || /\.png$/i.test(parsed.ext || "");
					const extension = hasPng ? ".png" : (att.contentType?.split("/")[1] ? `.${att.contentType.split("/")[1]}` : ".bin");
					const cleanName = sanitizeSegment(parsed.name || "attachment");
					const parts = [projectName, testTitle, cleanName].filter(Boolean);
					const partsSeen = new Set();
					const ordered = [];
					for (const p of parts) {
						if (!partsSeen.has(p)) {
							partsSeen.add(p);
							ordered.push(p);
						}
					}
					const preferredBase = ordered.join("-");
					const target = await makeFlatTargetPath(outDirectory, [], extension, preferredBase);
					const buf = Buffer.isBuffer(att.body) ? att.body : Buffer.from(att.body);
					await fsp.writeFile(target, buf);
				} catch (error) {
					console.warn(`[flat-screenshots-reporter] Could not write attachment image ${att.name}:`, error?.message || error);
				}
			}
		}
	}

	async onEnd() {
		// Clean up the run-id marker so the next run generates a fresh subdir (unless provided via env)
		if (this._runIdMarker) {
			try {
				await fsp.unlink(this._runIdMarker);
			} catch {
				/* ignore */
			}
		}
		// Final sweep: remove empty directories created by Playwright under the run folder
		try {
			if (this.outputDir && fs.existsSync(this.outputDir)) {
				await removeEmptyDirectoriesUnder(this.outputDir);
			}
		} catch {
			// ignore
		}
	}
}

export default FlatScreenshotsReporter;
