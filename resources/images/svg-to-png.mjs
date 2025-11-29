#!/usr/bin/env node
/**
 * Convert an SVG spritesheet into a single PNG and optionally split it into tile PNGs.
 *
 * Improvements:
 * - If the SVG contains a <g id="t_preview"> grid, we use it to determine:
 *   - the number of rows/columns (layout)
 *   - the export order
 *   - the tile names (from child group ids or attributes)
 *   - optionally the tile cell width/height (scaled to the full sheet)
 * - Falls back to a simple grid (defaults 12x7) if t_preview is missing or unparsable.
 *
 * Usage examples:
 *   node svg-to-png.mjs \
 *     --src animals.svg \
 *     --out ../../src/assets/svg/animals \
 *     --png ../../src/assets/svg/animals/animals.png \
 *     --cols 12 --rows 7
 *
 * Options:
 * - --cols/--rows: override detected layout
 * - --tileWidth/--tileHeight: grid inference when no t_preview is available
 * - --density: SVG rasterization density (default 384)
 * - --maxWidth: max width of the exported full PNG (default 1080)
 * - --colors256: quantize full PNG and tiles to a 256-color palette (optional)
 * - --split: export each tile into own image (optional)
 * - --oxipng: run oxipng on the exported PNGs to reduce file size (optional)
 * - --oxipngArgs: custom arguments passed to oxipng (optional)
 * - --tileOutWidth/--tileOutHeight: optional minimum output size for each tile (preserve aspect ratio; tiles are only scaled up if smaller)
 * - --start-row N: skip the first N-1 rows (1-based) in BOTH the full PNG and the per-tile export.
 *   - Example: --start-row 3 removes the first two rows from the full sheet and exports tiles starting at row 3.
 *   - Accepts --startRow as alias. 0 is treated like 1. (optional)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import sharp from "sharp";
import { spawn } from "node:child_process";

// Ensure sharp does not keep resources cached that could delay process exit
sharp.cache(false);

function parseArguments(argv) {
	const arguments_ = {};
	for (let index = 2; index < argv.length; index++) {
		const a = argv[index];
		if (a.startsWith("--")) {
			const key = a.slice(2);
			const next = argv[index + 1];
			if (next && !next.startsWith("--")) {
				arguments_[key] = next;
				index++;
			} else {
				arguments_[key] = true;
			}
		}
	}
	return arguments_;
}

function ensureDirectory(p) {
	return fs.mkdir(p, { recursive: true });
}

function pad(num, size = 2) {
	let s = String(num);
	while (s.length < size) {
		s = `0${s}`;
	}
	return s;
}

async function runOxipng(targetPath, extraArguments = []) {
	return new Promise(resolve => {
		const defaultArguments = ["-o", "4", "--strip", "safe", "-q"];
		const arguments_ = [...defaultArguments, ...extraArguments, targetPath];
		const child = spawn("oxipng", arguments_, { stdio: "inherit" });
		child.on("error", error => {
			if (error && error.code === "ENOENT") {
				console.warn("[oxipng] oxipng not found in PATH. Skipping optimization.");
				return resolve(false);
			}
			console.warn("[oxipng] Failed to start:", error?.message || error);
			resolve(false);
		});
		child.on("exit", code => {
			if (code === 0) {
				resolve(true);
			} else {
				console.warn(`[oxipng] Exited with code ${code}.`);
				resolve(false);
			}
		});
	});
}

function sanitizeName(name) {
	return String(name || "tile")
		.trim()
		.replace(/^t[_-]/i, "")
		.replace(/\s+/g, "-")
		.replace(/[^a-zA-Z0-9._-]/g, "-")
		.replace(/--+/g, "-")
		.toLowerCase();
}

// More robust XML-ish parser for t_preview content (supports nesting, namespaces, single quotes, translate/matrix)
// eslint-disable-next-line complexity
function extractTPPreviewEntries(svgText) {
	// Locate the opening <g id="t_preview"> with any quoting
	const startRe = /<g\b[^>]*id\s*=\s*(["'])t_preview\1[^>]*>/i;
	const start = svgText.search(startRe);
	if (start === -1) {
		return null;
	}
	const startTagMatch = svgText.slice(start).match(startRe);
	if (!startTagMatch) {
		return null;
	}
	const startTag = startTagMatch[0];
	const startPos = start + startTag.length;

	// Find the matching closing </g> by tracking nested <g> depth
	const tagRe = /<\s*(\/)?\s*([a-zA-Z:]+)\b[^>]*>/g;
	tagRe.lastIndex = startPos;
	let depth = 1;
	let endPos = -1;
	let m;
	while ((m = tagRe.exec(svgText))) {
		const isClose = Boolean(m[1]);
		const name = m[2].toLowerCase();
		if (name !== "g" && !name.endsWith(":g")) {
			continue;
		}
		if (isClose) {
			depth--;
		} else {
			const selfClosing = /\/>\s*$/.test(m[0]);
			if (!selfClosing) {
				depth++;
			}
		}
		if (depth === 0) {
			endPos = m.index + m[0].length;
			break;
		}
	}
	if (endPos === -1) {
		return null;
	}
	// Remove the trailing </g> from captured content
	const content = svgText.slice(startPos, endPos).replace(/<\s*\/\s*g\s*>\s*$/i, "");

	const entries = [];
	const parseNum = s => {
		if (s == null) {
			return 0;
		}
		const mm = String(s).match(/-?\d*\.?\d+(?:e[+-]?\d+)?/i);
		return mm ? Number.parseFloat(mm[0]) : 0;
	};
	const getAttribute = (attributes, name) => {
		const re = new RegExp(String.raw`${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`, "i");
		const am = attributes.match(re);
		return am ? (am[1] ?? am[2]) : undefined;
	};
	const parseTransform = attributes => {
		const tr = { x: 0, y: 0 };
		const tm = attributes.match(/transform\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
		const tstr = tm ? (tm[1] ?? tm[2]) : "";
		if (!tstr) {
			return tr;
		}
		const tTranslate = tstr.match(/translate\(([^)]*)\)/i);
		if (tTranslate) {
			const p = tTranslate[1].split(/[ ,]+/).map(v => Number.parseFloat(v)).filter(v => !Number.isNaN(v));
			tr.x += p[0] || 0;
			tr.y += p[1] || 0;
		}
		const tMatrix = tstr.match(/matrix\(([^)]*)\)/i);
		if (tMatrix) {
			const p = tMatrix[1].split(/[ ,]+/).map(v => Number.parseFloat(v)).filter(v => !Number.isNaN(v));
			if (p.length >= 6) {
				tr.x += p[4] || 0;
				tr.y += p[5] || 0;
			}
		}
		return tr;
	};

	// Iterate tags inside content; keep a stack of group attributes to accumulate transforms and names
	const innerRe = /<\s*(\/)?\s*([a-zA-Z:]+)\b([^>]*)>/g;
	const stack = [];
	let m2;
	while ((m2 = innerRe.exec(content))) {
		const closing = Boolean(m2[1]);
		const tag = m2[2].toLowerCase();
		const attributes = m2[3] || "";

		// Handle groups (possibly namespaced like svg:g)
		if (!closing && (tag === "g" || tag.endsWith(":g"))) {
			if (!/\/>\s*$/.test(m2[0])) {
				stack.push({ attrs: attributes });
			}
			continue;
		}
		if (closing && (tag === "g" || tag.endsWith(":g"))) {
			stack.pop();
			continue;
		}

		// Handle rects (possibly namespaced)
		if (tag === "rect" || tag.endsWith(":rect")) {
			const w = parseNum(getAttribute(attributes, "width"));
			const h = parseNum(getAttribute(attributes, "height"));
			if (!(w > 0 && h > 0)) {
				continue;
			}
			const rx = parseNum(getAttribute(attributes, "x"));
			const ry = parseNum(getAttribute(attributes, "y"));

			// accumulate transforms and choose first available name in stack
			let tx = 0;
			let ty = 0;
			let name = "";
			for (const g of stack) {
				const t = parseTransform(g.attrs);
				tx += t.x;
				ty += t.y;
				if (!name) {
					name = getAttribute(g.attrs, "id") || getAttribute(g.attrs, "data-name") || getAttribute(g.attrs, "name") || getAttribute(g.attrs, "aria-label");
				}
			}
			// include element's own transform
			const selfT = parseTransform(attributes);
			tx += selfT.x;
			ty += selfT.y;

			name = name || getAttribute(attributes, "id") || getAttribute(attributes, "data-name") || getAttribute(attributes, "name") || getAttribute(attributes, "aria-label") || "";

			entries.push({
				name: sanitizeName(name),
				x: tx + rx,
				y: ty + ry,
				width: w,
				height: h
			});
		}

		// Handle use elements within t_preview (common in spritesheets)
		if (tag === "use" || tag.endsWith(":use")) {
			const w = parseNum(getAttribute(attributes, "width"));
			const h = parseNum(getAttribute(attributes, "height"));
			if (!(w > 0 && h > 0)) {
				continue;
			}
			const ux = parseNum(getAttribute(attributes, "x"));
			const uy = parseNum(getAttribute(attributes, "y"));

			// accumulate transforms from ancestor groups and the element itself
			let tx = 0;
			let ty = 0;
			for (const g of stack) {
				const t = parseTransform(g.attrs);
				tx += t.x;
				ty += t.y;
			}
			const selfT = parseTransform(attributes);
			tx += selfT.x;
			ty += selfT.y;

			// determine name from href or id attributes
			let href = getAttribute(attributes, "xlink:href") || getAttribute(attributes, "href") || "";
			href = href.replace(/^#/, "");
			const name = href || getAttribute(attributes, "id") || getAttribute(attributes, "data-name") || getAttribute(attributes, "name") || getAttribute(attributes, "aria-label") || "";

			entries.push({
				name: sanitizeName(name),
				x: tx + ux,
				y: ty + uy,
				width: w,
				height: h
			});
		}
	}

	if (entries.length === 0) {
		return null;
	}
	return entries;
}

function clusterValues(values, tolerance = 1e-3) {
	// Group nearly-equal numbers into buckets; returns sorted representative values
	const sorted = [...values].sort((a, b) => a - b);
	const clusters = [];
	for (const v of sorted) {
		const last = clusters.at(-1);
		if (!last || Math.abs(v - last.at(-1)) > tolerance) {
			clusters.push([v]);
		} else {
			last.push(v);
		}
	}
	return clusters.map(c => c.reduce((a, b) => a + b, 0) / c.length);
}

function assignGridIndices(entries) {
	// Compute distinct x,y bands to define columns/rows
	const xCenters = entries.map(entry => entry.x + entry.width / 2);
	const yCenters = entries.map(entry => entry.y + entry.height / 2);
	const xBands = clusterValues(xCenters, 0.5); // SVG units; small tolerance
	const yBands = clusterValues(yCenters, 0.5);

	// Sort bands top-to-bottom, left-to-right
	yBands.sort((a, b) => a - b);
	xBands.sort((a, b) => a - b);

	function closestIndex(value, bands) {
		let bestIndex = 0;
		let bestDistance = Number.POSITIVE_INFINITY;
		for (const [index, band] of bands.entries()) {
			const d = Math.abs(value - band);
			if (d < bestDistance) {
				bestDistance = d;
				bestIndex = index;
			}
		}
		return bestIndex;
	}

	for (const entry of entries) {
		const yc = entry.y + entry.height / 2;
		const xc = entry.x + entry.width / 2;
		entry.row = closestIndex(yc, yBands);
		entry.col = closestIndex(xc, xBands);
	}
	const rows = yBands.length;
	const cols = xBands.length;
	return { rows, cols, entries };
}

// eslint-disable-next-line complexity
async function main() {
	const arguments_ = parseArguments(process.argv);
	const source = arguments_.src;
	const outPng = arguments_.png;
	if (!source || !outPng) {
		console.error("Missing required arguments: --src, --png are required.");
		process.exit(1);
	}
	let cols = arguments_.cols ? Number.parseInt(arguments_.cols, 10) : undefined;
	let rows = arguments_.rows ? Number.parseInt(arguments_.rows, 10) : undefined;
	const density = arguments_.density ? Number.parseInt(arguments_.density, 10) : 384; // higher density for crisp rasterization
	const maxWidth = arguments_.maxWidth ? Number.parseInt(arguments_.maxWidth, 10) : 1080;
	// Optional: force output size based on cell dimensions (pixels per grid cell)
	const cellWidth = arguments_.cellWidth ? Number.parseInt(arguments_.cellWidth, 10) : (arguments_.cellW ? Number.parseInt(arguments_.cellW, 10) : undefined);
	const cellHeight = arguments_.cellHeight ? Number.parseInt(arguments_.cellHeight, 10) : (arguments_.cellH ? Number.parseInt(arguments_.cellH, 10) : undefined);
	const colors256 = Boolean(arguments_.colors256);
	const useOxipng = Boolean(arguments_.oxipng);
	const oxipngArguments = typeof arguments_.oxipngArgs === "string" ? arguments_.oxipngArgs.split(/\s+/).filter(Boolean) : [];

	const tileWidth = arguments_.tileWidth ? Number.parseInt(arguments_.tileWidth, 10) : undefined;
	const tileHeight = arguments_.tileHeight ? Number.parseInt(arguments_.tileHeight, 10) : undefined;
	// Optional minimum output size for each exported tile (only upscale; preserve aspect ratio)
	const tileOutWidth = arguments_.tileOutWidth ? Number.parseInt(arguments_.tileOutWidth, 10) : undefined;
	const tileOutHeight = arguments_.tileOutHeight ? Number.parseInt(arguments_.tileOutHeight, 10) : undefined;
	// Optional: export only rows starting from a given row number (1-based; 0 allowed to mean first row)
	const startRowArgument = arguments_["start-row"] ?? arguments_.startRow;
	let startRow0 = 0;
	if (startRowArgument !== undefined) {
		const sr = Number.parseInt(startRowArgument, 10);
		if (!Number.isNaN(sr) && sr > 1) {
			startRow0 = sr - 1; // treat as 1-based by default
		} else if (sr === 1) {
			startRow0 = 0;
		} else if (sr === 0) {
			startRow0 = 0;
		} // allow 0 explicitly
	}

	const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
	const sourcePath = path.resolve(rootDirectory, source);
	const outPngPath = path.resolve(rootDirectory, outPng);

	// Read SVG (as text and buffer)
	const svgBuffer = await fs.readFile(sourcePath);
	const svgText = svgBuffer.toString("utf8");

	// Try to parse t_preview to obtain names and layout
	// const viewBox = parseViewBox(svgText); // unused
	const debug = Boolean(arguments_.debug);
	const hasTP = /<g\b[^>]*id\s*=\s*(["'])t_preview\1/i.test(svgText);
	const tp = extractTPPreviewEntries(svgText);
	let detected = null;
	if (tp && tp.length > 0) {
		detected = assignGridIndices(tp);
		// If --cols/--rows not given, adopt detected
		if (!cols) {
			cols = detected.cols;
		}
		if (!rows) {
			rows = detected.rows;
		}
	} else if (hasTP && debug) {
		// Provide a short snippet around t_preview for diagnostics
		const pos = svgText.search(/<g\b[^>]*id\s*=\s*(["'])t_preview\1/i);
		const snippet = svgText.slice(Math.max(0, pos - 200), Math.min(svgText.length, pos + 600));
		console.warn("[t_preview] Found group but could not parse any entries. Enable --debug for snippet:");
		console.warn(`${snippet.replace(/\s+/g, " ").slice(0, 400)}...`);
	}

	// Determine target output dimensions if cellWidth/Height provided and grid known
	let targetW = undefined;
	let targetH = undefined;
	const effCols = cols ?? (detected ? detected.cols : undefined);
	const effRows = rows ?? (detected ? detected.rows : undefined);
	if (cellWidth && cellHeight && effCols && effRows) {
		// Compute full-sheet target size from total rows/cols; cropping for start-row is applied later
		targetW = Math.max(1, Math.round(effCols * cellWidth));
		targetH = Math.max(1, Math.round(effRows * cellHeight));
	}

	// Rasterize the SVG to PNG buffer first
	let raster = sharp(svgBuffer, { density });
	if (targetW && targetH) {
		// Force exact output size based on cell dimensions (no cropping)
		raster = raster.resize({ width: targetW, height: targetH, fit: "fill" });
	} else if (Number.isFinite(maxWidth) && maxWidth > 0) {
		raster = raster.resize({ width: maxWidth, withoutEnlargement: true });
	}
	const pngOptions = { compressionLevel: 9, adaptiveFiltering: true, ...(colors256 ? { palette: true, colors: 256 } : {}) };
	const pngPipeline = raster.png(pngOptions);
	const pngBuffer = await pngPipeline.toBuffer();
	const meta = await sharp(pngBuffer).metadata();
	const imgW = meta.width || 0;
	const imgH = meta.height || 0;

	// Optionally crop full PNG to skip initial rows when --start-row is provided
	let fullOutBuffer = pngBuffer;
	let finalW = imgW;
	let finalH = imgH;
	const effRowsForFull = effRows; // may be undefined if grid not known
	const startRowFull = Math.max(0, Math.min(startRow0 || 0, effRowsForFull || 0));
	if (effRowsForFull && startRowFull > 0) {
		const cropTop = Math.floor((imgH * startRowFull) / effRowsForFull);
		let cropH = imgH - cropTop;
		if (cropH < 1) {
			cropH = 1;
		}
		fullOutBuffer = await sharp(pngBuffer).extract({ left: 0, top: cropTop, width: imgW, height: cropH }).toBuffer();
		const fmeta = await sharp(fullOutBuffer).metadata();
		finalW = fmeta.width || imgW;
		finalH = fmeta.height || cropH;
		console.log(`[full] start-row=${startRowFull + 1} (1-based): skipping rows 1..${startRowFull} → crop top=${cropTop}px; final size ${finalW}x${finalH}`);
	}

	// Ensure output directories exist
	await ensureDirectory(path.dirname(outPngPath));

	console.log(`Writing full PNG: ${path.relative(rootDirectory, outPngPath)} (${finalW}x${finalH})`);

	// Write full PNG export
	await fs.writeFile(outPngPath, fullOutBuffer);
	console.log(`Exported full PNG: ${path.relative(rootDirectory, outPngPath)} (${finalW}x${finalH})`);

	// Optionally optimize the full PNG with oxipng
	if (useOxipng) {
		console.log("[oxipng] Optimizing full PNG ...");
		await runOxipng(outPngPath, oxipngArguments);
	}

	const outDirectory = arguments_.out;
	if (outDirectory) {
		const outTilesPath = path.resolve(rootDirectory, outDirectory);
		await ensureDirectory(outTilesPath);
		// Determine slicing grid if still missing
		if ((!cols || !rows) && (tileWidth || tileHeight)) {
			if (!cols && tileWidth) {
				cols = Math.max(1, Math.round(imgW / tileWidth));
			}
			if (!rows && tileHeight) {
				rows = Math.max(1, Math.round(imgH / tileHeight));
			}
		}
		if (!cols) {
			cols = 12;
		}
		if (!rows) {
			rows = 7;
		}

		const cellW = Math.floor(imgW / cols);
		const cellH = Math.floor(imgH / rows);

		// Build naming map: either from t_preview order or numeric
		let nameGrid = null;
		if (detected?.entries) {
			// Prepare a cols x rows name grid
			nameGrid = Array.from({ length: rows }, () => Array.from({ length: cols }).fill(null));
			for (const entry of detected.entries) {
				const r = Math.min(rows - 1, Math.max(0, entry.row));
				const c = Math.min(cols - 1, Math.max(0, entry.col));
				const nm = entry.name || `tile-${r}-${c}`;
				nameGrid[r][c] = sanitizeName(nm);
			}
		}

		// Apply start row constraint (skip rows before this)
		const startRow = Math.max(0, Math.min(startRow0 || 0, rows));
		if (startRow > 0) {
			console.log(`[split] start-row=${startRow + 1} (1-based): skipping rows 1..${startRow}`);
		}

		// Slice into tiles
		let exported = 0;
		const promises = [];
		for (let r = startRow; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				// compute crop box for this tile
				const left = Math.floor((imgW * c) / cols);
				const top = Math.floor((imgH * r) / rows);
				const right = (c === cols - 1) ? imgW : Math.floor((imgW * (c + 1)) / cols);
				const bottom = (r === rows - 1) ? imgH : Math.floor((imgH * (r + 1)) / rows);
				let w = right - left;
				let h = bottom - top;
				// Clamp to image bounds to avoid sharp extract_area errors
				if (left + w > imgW) {
					w = imgW - left;
				}
				if (top + h > imgH) {
					h = imgH - top;
				}
				w = Math.max(1, w);
				h = Math.max(1, h);
				const seq = ++exported; // exported index (1-based)
				const baseName = nameGrid?.[r]?.[c] || `tile-${pad(seq, 2)}`;
				const fileName = `${baseName}.png`;
				const filePath = path.join(outTilesPath, fileName);
				let tilePipeline = sharp(pngBuffer).extract({ left, top, width: w, height: h });
				// Optionally upscale tiles to meet minimum output size while preserving aspect ratio
				if (tileOutWidth || tileOutHeight) {
					const sw = tileOutWidth ? (tileOutWidth / w) : 0;
					const sh = tileOutHeight ? (tileOutHeight / h) : 0;
					let scale = Math.max(sw || 0, sh || 0);
					if (!(scale > 0)) {
						scale = 1;
					} // no constraints
					if (scale > 1) {
						const targetW = Math.max(w, Math.round(w * scale));
						// Provide only width to preserve aspect ratio without cropping/distortion
						tilePipeline = tilePipeline.resize({ width: targetW, withoutEnlargement: false });
					}
				}
				tilePipeline = tilePipeline.png(pngOptions);
				promises.push(tilePipeline.toFile(filePath));
			}
		}

		await Promise.all(promises);

		// Optionally run oxipng on tiles directory (optimize all PNGs)
		if (useOxipng) {
			console.log("[oxipng] Optimizing tiles ...");
			await runOxipng(outTilesPath, ["-r", ...oxipngArguments]);
		}

		const effRows = Math.max(0, rows - startRow);
		console.log(`Exported ${exported} tiles to: ${path.relative(rootDirectory, outTilesPath)} (${cols}x${effRows}, ${cellW}x${cellH} each)`);
		if (nameGrid) {
			const sample = nameGrid.flat().filter(Boolean).slice(0, 5).join(", ");
			console.log(`[t_preview] Detected layout ${cols}x${rows}; sample names: ${sample}`);
		} else {
			console.log("[t_preview] Not found or unparsable — used fallback grid.");
		}
	}
}

main()
	.then(() => {
	// Explicitly exit to avoid hanging processes due to lingering handles in native deps
		process.exit(0);
	})
	.catch(error => {
		console.error("[export-animals] Failed:", error);
		process.exit(1);
	});
