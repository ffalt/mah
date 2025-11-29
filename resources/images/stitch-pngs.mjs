#!/usr/bin/env node
/**
 * Stitch all PNG tile images referenced by a svg into one large PNG,
 * honoring the layout positions given by the <use> elements in the SVG.
 *
 * The SVG defines symbols via <image id="..." xlink:href="./picasso/*.png" width/height>
 * and then positions them via <use xlink:href="#..." x="..." y="..." width/height>.
 * We parse those and composite all source PNGs into a single canvas using Sharp.
 *
 * Usage (required):
 *   node stitch-pngs.mjs \
 *     --svg picasso.svg \
 *     --dir ./picasso \
 *     --out ../../src/assets/svg/picasso/picasso.png \
 *     [--bg #00000000] [--scale 1] [--cellWidth 160] [--cellHeight 198]
 *     [--scale-tile true|false]
 *     [--colors256] [--oxipng] [--oxipngArgs "-o 4"]
 *
 * Notes:
 * - The flags --svg, --dir and --out are mandatory (no defaults).
 * - Also accepted aliases: --cellW/--cellH or simply --width/--height for cell size.
 *
 * Notes:
 * - If a referenced image file cannot be found, it will be skipped with a warning.
 * - Fallback: If no corresponding <image id="..."> exists for a <use xlink:href="#name">,
 *   the script will try to load an image file named "name.png" from the --dir folder.
 *   If that is missing and the name begins with "t_", it will also try without the
 *   leading "t_" (i.e., lookup "nameWithoutPrefix.png").
 * - Images are placed centered inside the cell defined by the corresponding <use>
 *   width/height. If the source is larger than the cell, it will be scaled down
 *   to fit while maintaining aspect ratio.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { spawn } from "node:child_process";

sharp.cache(false);

// Minimum grid cell size to avoid shrinking images; smaller images are centered
const MIN_CELL_W = 160;
const MIN_CELL_H = 213;

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

async function runOxipng(targetPath, extraArguments = []) {
	return new Promise(resolve => {
		const defaultArguments = ["-o", "4", "--strip", "safe", "-q"]; // reasonable defaults
		const arguments_ = [...defaultArguments, ...extraArguments, targetPath];
		const child = spawn("oxipng", arguments_, { stdio: "inherit" });
		child.on("error", error => {
			if (error && error.code === "ENOENT") {
				console.warn("[oxipng] not found in PATH; skipping optimization");
				return resolve(false);
			}
			console.warn("[oxipng] failed to start:", error?.message || error);
			resolve(false);
		});
		child.on("exit", code => resolve(code === 0));
	});
}

function unPx(v) {
	if (v == null) {
		return null;
	}
	const m = String(v).match(/(-?\d*\.?\d+)/);
	return m ? Number.parseFloat(m[1]) : null;
}

// eslint-disable-next-line complexity
function parseImages(svgText) {
	// Map id => {href,width,height,invert}
	const images = new Map();
	const imageRe = /<image\s+([^>]*?)\/>/g; // self-closing <image .../>
	let m;
	while ((m = imageRe.exec(svgText))) {
		const attributes = m[1];
		const id = attributes.match(/id\s*=\s*"([^"]+)"/)?.[1];
		const href = attributes.match(/xlink:href\s*=\s*"([^"]+)"/)?.[1] || attributes.match(/href\s*=\s*"([^"]+)"/)?.[1];
		const width = unPx(attributes.match(/width\s*=\s*"([^"]+)"/)?.[1]);
		const height = unPx(attributes.match(/height\s*=\s*"([^"]+)"/)?.[1]);
		// Check class, style and filter attributes (support both double and single quotes)
		const classAttribute = attributes.match(/\bclass\s*=\s*"([^"]*)"/)?.[1] || attributes.match(/\bclass\s*=\s*'([^']*)'/)?.[1] || "";
		const style = attributes.match(/style\s*=\s*"([^"]*)"/)?.[1] || attributes.match(/style\s*=\s*'([^']*)'/)?.[1] || "";
		const filterAttribute = attributes.match(/\bfilter\s*=\s*"([^"]*)"/)?.[1] || attributes.match(/\bfilter\s*=\s*'([^']*)'/)?.[1] || "";
		const classHasInverse = /(?:^|\s)inverse(?:\s|$)/i.test(classAttribute);
		const styleHasInvert = /\bfilter\s*:\s*[^;]*invert\(\s*(?:100%|1)\s*\)/i.test(style);
		const filterHasInvert = /\binvert\(\s*(?:100%|1)\s*\)/i.test(filterAttribute);
		const invert = classHasInverse || styleHasInvert || filterHasInvert;
		if (!id || !href) {
			continue;
		}
		images.set(id, { href, width, height, invert });
	}
	return images;
}

// eslint-disable-next-line complexity
function parseUses(svgText) {
	// Collect placement cells: {id, x, y, width, height, invert}
	const uses = [];
	const useRe = /<use\s+([^>]*?)\/>/g;
	let m;
	while ((m = useRe.exec(svgText))) {
		const attributes = m[1];
		const href = attributes.match(/xlink:href\s*=\s*"#([^"]+)"/)?.[1] || attributes.match(/href\s*=\s*"#([^"]+)"/)?.[1] || attributes.match(/xlink:href\s*=\s*'#([^']+)'/)?.[1] || attributes.match(/href\s*=\s*'#([^']+)'/)?.[1];
		if (!href) {
			continue;
		}
		const x = unPx(attributes.match(/\bx\s*=\s*"([^"]+)"/)?.[1] || attributes.match(/\bx\s*=\s*'([^']+)'/)?.[1]) ?? 0;
		const y = unPx(attributes.match(/\by\s*=\s*"([^"]+)"/)?.[1] || attributes.match(/\by\s*=\s*'([^']+)'/)?.[1]) ?? 0;
		const width = unPx(attributes.match(/width\s*=\s*"([^"]+)"/)?.[1] || attributes.match(/width\s*=\s*'([^']+)'/)?.[1]);
		const height = unPx(attributes.match(/height\s*=\s*"([^"]+)"/)?.[1] || attributes.match(/height\s*=\s*'([^']+)'/)?.[1]);
		const classAttribute = attributes.match(/\bclass\s*=\s*"([^"]*)"/)?.[1] || attributes.match(/\bclass\s*=\s*'([^']*)'/)?.[1] || "";
		const style = attributes.match(/style\s*=\s*"([^"]*)"/)?.[1] || attributes.match(/style\s*=\s*'([^']*)'/)?.[1] || "";
		const filterAttribute = attributes.match(/\bfilter\s*=\s*"([^"]*)"/)?.[1] || attributes.match(/\bfilter\s*=\s*'([^']*)'/)?.[1] || "";
		const classHasInverse = /(?:^|\s)inverse(?:\s|$)/i.test(classAttribute);
		const styleHasInvert = /\bfilter\s*:\s*[^;]*invert\(\s*(?:100%|1)\s*\)/i.test(style);
		const filterHasInvert = /\binvert\(\s*(?:100%|1)\s*\)/i.test(filterAttribute);
		const invert = classHasInverse || styleHasInvert || filterHasInvert;
		uses.push({ id: href, x, y, width, height, invert });
	}
	return uses;
}

async function ensureDirectory(p) {
	await fs.mkdir(path.dirname(p), { recursive: true });
}

// eslint-disable-next-line complexity
async function main() {
	const arguments_ = parseArguments(process.argv);
	const svgPath = arguments_.svg;
	const imagesDirectory = arguments_.dir;
	const outPath = arguments_.out;
	if (!svgPath || !imagesDirectory || !outPath) {
		console.error("Missing required arguments. Usage:\n  node stitch-pngs.mjs --svg <file.svg> --dir <images_dir> --out <out.png>\nOptional: --bg, --scale, --cellWidth/--cellHeight, --colors256, --oxipng, --oxipngArgs");
		process.exitCode = 1;
		return;
	}
	const bg = arguments_.bg || "#00000000"; // transparent
	const scale = arguments_.scale ? Number.parseFloat(arguments_.scale) : 1;
	const pad = arguments_.pad ? Number.parseFloat(arguments_.pad) : 0; // optional padding (in same units as SVG coords)
	const wantOxipng = !!arguments_.oxipng;
	const oxiArguments = (arguments_.oxipngArgs && String(arguments_.oxipngArgs).trim().length > 0) ?
		String(arguments_.oxipngArgs).split(/\s+/) :
		[];
	const useColors256 = !!arguments_.colors256; // limit output PNG to 256 colors (palette mode)
	const debug = !!arguments_.debug;
	const avoidDarkRed = !!(arguments_.avoidDarkRed || arguments_["avoid-dark-red"]);
	const avoidDarkGreen = !!(arguments_.avoidDarkGreen || arguments_["avoid-dark-green"]);
	// optional: upscale tiles smaller than their grid cell before centering
	const scaleTile = (() => {
		const v = arguments_["scale-tile"] ?? arguments_.scaleTile;
		if (v === undefined) {
			return true;
		}
		if (typeof v === "boolean") {
			return v;
		}
		const s = String(v).toLowerCase();
		return s === "1" || s === "true" || s === "yes" || s === "on";
	})();

	// Allow forcing a uniform grid cell width/height regardless of SVG/use sizes
	const forcedCellW = arguments_.cellWidth ?? arguments_.cellW ?? arguments_.width;
	const forcedCellH = arguments_.cellHeight ?? arguments_.cellH ?? arguments_.height;
	const CELL_W_OVERRIDE = forcedCellW == null ? null : Math.max(1, Math.round(Number.parseFloat(forcedCellW)));
	const CELL_H_OVERRIDE = forcedCellH == null ? null : Math.max(1, Math.round(Number.parseFloat(forcedCellH)));

	const svgText = await fs.readFile(svgPath, "utf8");
	const imageDefs = parseImages(svgText);
	const uses = parseUses(svgText);
	if (uses.length === 0) {
		console.error("No <use> elements found in", svgPath);
		process.exitCode = 2;
		return;
	}

	// Compute canvas dimensions using a column/row grid derived from unique x/y positions
	const uniqueX = [...new Set(uses.map(u => u.x))].sort((a, b) => a - b);
	const uniqueY = [...new Set(uses.map(u => u.y))].sort((a, b) => a - b);
	const xToCol = new Map(uniqueX.map((x, index) => [x, index]));
	const yToRow = new Map(uniqueY.map((y, index) => [y, index]));
	const nCols = uniqueX.length;
	const nRows = uniqueY.length;

	// Determine per-column widths and per-row heights (at least the minimum cell size)
	const colWidths = Array.from({ length: nCols }).fill(CELL_W_OVERRIDE ?? MIN_CELL_W);
	const rowHeights = Array.from({ length: nRows }).fill(CELL_H_OVERRIDE ?? MIN_CELL_H);

	// Only compute from SVG/use sizes for the dimensions that are not forced
	if (CELL_W_OVERRIDE == null || CELL_H_OVERRIDE == null) {
		for (const u of uses) {
			const definition = imageDefs.get(u.id);
			const col = xToCol.get(u.x);
			const row = yToRow.get(u.y);
			const baseCellW = CELL_W_OVERRIDE ?? (u.width ?? definition?.width ?? MIN_CELL_W);
			const baseCellH = CELL_H_OVERRIDE ?? (u.height ?? definition?.height ?? MIN_CELL_H);
			if (CELL_W_OVERRIDE == null && col != null) {
				colWidths[col] = Math.max(colWidths[col], Math.max(baseCellW, MIN_CELL_W));
			}
			if (CELL_H_OVERRIDE == null && row != null) {
				rowHeights[row] = Math.max(rowHeights[row], Math.max(baseCellH, MIN_CELL_H));
			}
		}
	}

	// Compute cumulative offsets for columns and rows
	const colOffsets = Array.from({ length: nCols }).fill(0);
	for (let index = 1; index < nCols; index++) {
		colOffsets[index] = colOffsets[index - 1] + colWidths[index - 1];
	}
	const rowOffsets = Array.from({ length: nRows }).fill(0);
	for (let index = 1; index < nRows; index++) {
		rowOffsets[index] = rowOffsets[index - 1] + rowHeights[index - 1];
	}

	// Apply optional padding (unscaled units) and compute canvas size in pixels
	const padL = pad;
	const padT = pad;
	const padR = pad;
	const padB = pad;
	const totalWUnits = colWidths.reduce((a, b) => a + b, 0);
	const totalHUnits = rowHeights.reduce((a, b) => a + b, 0);
	const canvasW = Math.ceil(((totalWUnits + padL + padR) * scale));
	const canvasH = Math.ceil(((totalHUnits + padT + padB) * scale));

	// Prepare composites
	const composites = [];
	let missing = 0;
	let placed = 0;

	for (const u of uses) {
		const imageDefinition = imageDefs.get(u.id);
		let filePath = null;
		let usedFallback = false;
		let usedFallbackReason = null;

		if (imageDefinition) {
			const fileRelative = imageDefinition.href.replace(/^\.\//, "");
			filePath = fileRelative;
			if (!path.isAbsolute(filePath)) {
				filePath = path.resolve(imagesDirectory, path.basename(fileRelative));
			}

			try {
				await fs.access(filePath);
			} catch {
				console.warn(`[skip] File not found for ${u.id}: ${filePath}`);
				missing++;
				continue;
			}
		} else {
			// Fallback: try name.png in the imagesDirectory, then try stripping leading "t_"
			const candidate = path.resolve(imagesDirectory, `${u.id}.png`);
			let candidate2 = null;
			try {
				await fs.access(candidate);
				filePath = candidate;
				usedFallback = true;
				usedFallbackReason = "direct";
			} catch {
				// Try without leading t_
				if (u.id.startsWith("t_")) {
					candidate2 = path.resolve(imagesDirectory, `${u.id.slice(2)}.png`);
					try {
						await fs.access(candidate2);
						filePath = candidate2;
						usedFallback = true;
						usedFallbackReason = "stripped";
					} catch {
						console.warn(`[skip] No <image id="${u.id}"> found and no fallback file ${candidate}${candidate2 ? ` or ${candidate2}` : ""}`);
						missing++;
						continue;
					}
				} else {
					console.warn(`[skip] No <image id="${u.id}"> found and no fallback file ${candidate}`);
					missing++;
					continue;
				}
			}
		}

		if (usedFallback) {
			const note = usedFallbackReason === "stripped" ? " (stripped t_)" : "";
			console.log(`[fallback] Using ${path.relative(process.cwd(), filePath)} for ${u.id}${note}`);
		}

		// Resolve grid cell from unique column/row and use computed per-col/row sizes
		const col = xToCol.get(u.x);
		const row = yToRow.get(u.y);
		const cellWUnits = colWidths[col] ?? MIN_CELL_W;
		const cellHUnits = rowHeights[row] ?? MIN_CELL_H;
		const cellW = Math.round(cellWUnits * scale);
		const cellH = Math.round(cellHUnits * scale);

		// Read source metadata for intrinsic sizing
		const meta = await sharp(filePath).metadata();
		const intrinsicW = meta.width || imageDefinition?.width || cellW;
		const intrinsicH = meta.height || imageDefinition?.height || cellH;

		// First apply global scale to the source dimensions
		const scaledW = Math.max(1, Math.round(intrinsicW * (scale || 1)));
		const scaledH = Math.max(1, Math.round(intrinsicH * (scale || 1)));

		// Fit into the cell respecting aspect ratio:
		// - Always downscale if it would overflow
		// - Optionally upscale smaller tiles to fit if --scale-tile is enabled
		let targetW = scaledW;
		let targetH = scaledH;
		if (scaledW > cellW || scaledH > cellH) {
			const factor = Math.min(cellW / scaledW, cellH / scaledH);
			targetW = Math.max(1, Math.floor(scaledW * factor));
			targetH = Math.max(1, Math.floor(scaledH * factor));
		} else if (scaleTile && (scaledW < cellW || scaledH < cellH)) {
			const factor = Math.min(cellW / scaledW, cellH / scaledH);
			targetW = Math.max(1, Math.floor(scaledW * factor));
			targetH = Math.max(1, Math.floor(scaledH * factor));
		}

		// Build the input buffer at the decided target size using a single resize
		// Preserve aspect ratio; enlargement allowed only when scaleTile=true
		let inputBuf;
		if (targetW !== intrinsicW || targetH !== intrinsicH) {
			const allowEnlarge = scaleTile || (targetW <= intrinsicW && targetH <= intrinsicH);
			inputBuf = await sharp(filePath)
				.resize({ width: targetW, height: targetH, fit: "inside", withoutEnlargement: !allowEnlarge })
				.toBuffer();
		} else {
			inputBuf = await fs.readFile(filePath);
		}

		// If either the <use> or its referenced <image> requested inversion, invert RGB but respect alpha
		const shouldInvert = !!(u.invert || (imageDefinition?.invert));
		if (debug) {
			const source = [u.invert ? "use" : null, imageDefinition?.invert ? "image" : null].filter(Boolean).join("+") || "none";
			console.log(`[tile] ${u.id} invert=${shouldInvert} (source: ${source})`);
		}
		if (shouldInvert) {
			try {
				// Apply a dark-background-friendly color map instead of simple inversion.
				// Preserve alpha; only remap RGB of non-transparent pixels to vivid, high-contrast colors.
				inputBuf = await applyDarkBgColormap(inputBuf, { avoidDarkRed, avoidDarkGreen });
			} catch (error) {
				console.warn(`[warn] Failed to apply dark colormap to ${u.id}:`, error?.message || error);
			}
		}

		// Use actual buffer metadata for precise centering
		const rmeta = await sharp(inputBuf).metadata();
		const sourceW = rmeta.width || targetW;
		const sourceH = rmeta.height || targetH;

		// Center inside the cell, then place at the column/row offset with padding
		// Use floor for the half-difference to avoid right/bottom bias when the remainder is odd
		const left = Math.floor(((padL + colOffsets[col]) * scale) + (cellW - sourceW) / 2);
		const top = Math.floor(((padT + rowOffsets[row]) * scale) + (cellH - sourceH) / 2);

		composites.push({ input: inputBuf, left, top });
		placed++;
	}

	await ensureDirectory(outPath);
	const canvas = sharp({ create: { width: Math.max(1, canvasW), height: Math.max(1, canvasH), channels: 4, background: bg } });
	const pngOptions = useColors256 ? { palette: true, colors: 256, dither: 1 } : {};
	await canvas.composite(composites).png(pngOptions).toFile(outPath);

	console.log(`Stitched ${placed} tiles into ${outPath}`);
	if (missing) {
		console.warn(`Missing/Skipped: ${missing}`);
	}

	if (wantOxipng) {
		const ok = await runOxipng(outPath, oxiArguments);
		if (ok) {
			console.log("oxipng optimization completed");
		}
	}
}

main().catch(error => {
	console.error("stitch-picasso failed:", error?.stack || error);
	process.exitCode = 1;
});

// Map RGB colors to a dark-background-friendly palette while preserving alpha transparency.
// - Keeps alpha channel unchanged.
// - For opaque/semi-opaque pixels: boosts saturation and brightness for readability on black.
// - Grayscale/low-saturation colors are remapped to vivid hues depending on original brightness.
// eslint-disable-next-line complexity
async function applyDarkBgColormap(inputBuf, options = {}) {
	// Decode to raw RGBA for per-pixel manipulation
	const { data, info } = await sharp(inputBuf)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const out = Buffer.from(data); // copy so we don't mutate shared memory
	const n = out.length;
	const W = info.width;
	const H = info.height;
	const STRIDE = 4;

	function clamp01(x) {
		return x < 0 ? 0 : (Math.min(x, 1));
	}

	function clamp255(x) {
		return x < 0 ? 0 : (x > 255 ? 255 : Math.trunc(x));
	}

	// Precompute luminance and a simple 3x3 local range (max-min) to preserve nearby color/detail differences
	const lumArray = new Float32Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const index = (y * W + x) * STRIDE;
			const a = out[index + 3];
			if (a <= 1) {
				lumArray[y * W + x] = 0;
				continue;
			}
			const r = out[index] / 255;
			const g = out[index + 1] / 255;
			const b = out[index + 2] / 255;
			lumArray[y * W + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}
	}
	const rangeArray = new Float32Array(W * H);
	const meanArray = new Float32Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			let lo = 1;
			let hi = 0;
			let sum = 0;
			let count = 0;
			for (let dy = -1; dy <= 1; dy++) {
				const yy = y + dy;
				if (yy < 0 || yy >= H) {
					continue;
				}
				for (let dx = -1; dx <= 1; dx++) {
					const xx = x + dx;
					if (xx < 0 || xx >= W) {
						continue;
					}
					const v = lumArray[yy * W + xx];
					if (v < lo) {
						lo = v;
					}
					if (v > hi) {
						hi = v;
					}
					sum += v;
					count++;
				}
			}
			const index1 = y * W + x;
			rangeArray[index1] = hi - lo; // 0..1
			meanArray[index1] = count ? (sum / count) : lumArray[index1];
		}
	}

	function rgbToHsv(r, g, b) {
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const d = max - min;
		let h = 0;
		const s = max === 0 ? 0 : d / max;
		const v = max;
		if (d !== 0) {
			switch (max) {
				case r: {
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				}
				case g: {
					h = (b - r) / d + 2;
					break;
				}
				case b: {
					h = (r - g) / d + 4;
					break;
				}
				default:
				// nop
			}
			h /= 6;
		}
		return [h, s, v];
	}

	function hsvToRgb(h, s, v) {
		const index = Math.floor(h * 6);
		const f = h * 6 - index;
		const p = v * (1 - s);
		const q = v * (1 - f * s);
		const t = v * (1 - (1 - f) * s);
		switch (index % 6) {
			case 0: {
				return [v, t, p];
			}
			case 1: {
				return [q, v, p];
			}
			case 2: {
				return [p, v, t];
			}
			case 3: {
				return [p, q, v];
			}
			case 4: {
				return [t, p, v];
			}
			case 5: {
				return [v, p, q];
			}
			default: {
				return [v, t, p];
			}
		}
	}

	// ---- Perceptual color space helpers (OKLab) for distance-based contrast boosts ----
	function srgbToLinear(u) {
		return u <= 0.040_45 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
	}

	function linearToSrgb(u) {
		return u <= 0.003_130_8 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;
	}

	function rgbToOklab(r, g, b) {
		// r,g,b are in 0..1 sRGB
		const rl = srgbToLinear(r);
		const gl = srgbToLinear(g);
		const bl = srgbToLinear(b);
		const l_ = 0.412_221_470_8 * rl + 0.536_332_536_3 * gl + 0.051_445_992_9 * bl;
		const m_ = 0.211_903_498_2 * rl + 0.680_699_545_1 * gl + 0.107_396_956_6 * bl;
		const s_ = 0.088_302_461_9 * rl + 0.281_718_837_6 * gl + 0.629_978_700_5 * bl;
		const l = Math.cbrt(l_);
		const m = Math.cbrt(m_);
		const s = Math.cbrt(s_);
		const L = 0.210_454_255_3 * l + 0.793_617_785 * m - 0.004_072_046_8 * s;
		const A = 1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s;
		const B = 0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s;
		return [L, A, B];
	}

	function oklabToRgb(L, A, B) {
		const l = L + 0.396_337_777_4 * A + 0.215_803_757_3 * B;
		const m = L - 0.105_561_345_8 * A - 0.063_854_172_8 * B;
		const s = L - 0.089_484_177_5 * A - 1.291_485_548 * B;
		const l3 = l * l * l;
		const m3 = m * m * m;
		const s3 = s * s * s;
		const rl = +4.076_741_662_1 * l3 - 3.307_711_591_3 * m3 + 0.230_969_929_2 * s3;
		const gl = -1.268_438_004_6 * l3 + 2.609_757_401_1 * m3 - 0.341_319_396_5 * s3;
		const bl = -0.004_196_086_3 * l3 - 0.703_418_614_7 * m3 + 1.707_614_701 * s3;
		let r = linearToSrgb(rl);
		let g = linearToSrgb(gl);
		let b = linearToSrgb(bl);
		// clamp to 0..1
		r = r < 0 ? 0 : (Math.min(r, 1));
		g = g < 0 ? 0 : (Math.min(g, 1));
		b = b < 0 ? 0 : (Math.min(b, 1));
		return [r, g, b];
	}

	for (let index = 0; index < n; index += 4) {
		const a = out[index + 3];
		if (a <= 1) {
			continue;
		} // fully transparent, leave RGB as-is to avoid halos

		// Pixel position and local detail metrics
		const p = index >> 2; // pixel index
		const lr = rangeArray[p]; // 0..1 local luminance range in 3x3
		// detail ~ how much structure exists locally; higher -> preserve more, tune threshold ~0.08
		const preserveK = Math.max(0, Math.min(1, lr / 0.08)); // 0..1
		const adjustK = 1 - preserveK; // less adjustment where detail is high

		// Pre-multiplied alpha handling: sharp raw data is not premultiplied, so safe.
		const r = out[index] / 255;
		const g = out[index + 1] / 255;
		const b = out[index + 2] / 255;

		// Compute perceived luminance to steer mapping
		const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b; // 0..1

		let [h, s, v] = rgbToHsv(r, g, b);

		// Special case: map black/near-black to white for better contrast on dark BGs
		// Detect very low luminance and value (near (#000)); keep alpha untouched.
		if ((lum <= 0.06 || v <= 0.06) && s <= 0.2) {
			// Force pure white and skip further adjustments
			out[index] = 255;
			out[index + 1] = 255;
			out[index + 2] = 255;
			// alpha unchanged
			continue;
		}
		if (s < 0.25) {
			// Grayscale-ish: map to pleasant hues but preserve nearby tone differences
			const t = lum; // 0..1
			// Choose a gentle hue based on brightness; reduce saturation where detail is high
			const targetH = t < 0.33 ? 0.55 : (t < 0.66 ? 0.33 : 0.1); // teal/lime/orange
			// Blend original hue slightly to keep uniqueness
			h = h * (0.2 + 0.3 * preserveK) + targetH * (0.8 - 0.3 * preserveK);
			const targetS = 0.9;
			const sK = 0.7 * adjustK; // less saturation boost in detailed areas
			s = clamp01(s + (targetS - s) * sK);
			// Keep V close to original to preserve local differences; slight lift only when low detail
			const baseTargetV = 0.88 - 0.1 * (1 - t);
			const vK = 0.6 * adjustK;
			v = clamp01(v + (baseTargetV - v) * vK);
		} else {
			// Keep hue, increase saturation and value to pop on dark BG, but adapt to local detail
			const targetS = Math.max(0.75, Math.min(1, s * 1.15));
			const sK = 0.6 * adjustK;
			s = clamp01(s + (targetS - s) * sK);
			// Lift darks softly, cap brights; adapt strength by detail
			const liftV = v < 0.6 ? 0.78 : Math.min(1, v * 0.95 + 0.05);
			const vK = 0.6 * adjustK;
			v = clamp01(v + (liftV - v) * vK);
		}

		// Mild contrast enhancement for very dark colors, scaled by lack of detail
		if (lum < 0.2) {
			const vMin = 0.75;
			v = Math.max(v, vMin * (0.5 * adjustK) + v * (1 - 0.5 * adjustK));
			s = Math.max(s, 0.85 * (0.5 * adjustK) + s * (1 - 0.5 * adjustK));
		}

		// Refined handling for dark and mid reds on black backgrounds; respect --avoid-dark-red option
		{
			const hueDeg = h * 360; // 0..360
			const inRed = (hueDeg <= 15 || hueDeg >= 345); // wrap-around red region
			if (inRed) {
				const preferOrange = !!(options && (options.avoidDarkRed));
				if (preferOrange) {
					// When requested, shift reds toward bright orange for better contrast on black
					const targetH = 30 / 360; // vivid orange
					h = clamp01(h * 0.15 + targetH * 0.85);
					s = Math.max(s, 0.95);
					v = Math.max(v, 0.92);
				} else if (s >= 0.5) {
					if (v < 0.6 || lum < 0.28) {
						// Very dark reds: keep near pure red and lift brightness a lot
						const minH = 0 / 360;
						const maxH = 10 / 360; // keep within 0°..10°
						h = clamp01(Math.min(maxH, Math.max(minH, h)));
						s = Math.max(s, 0.92);
						v = Math.max(v, 0.86);
					} else if (v < 0.8) {
						// Mid reds: preserve hue, increase saturation and raise V
						const minH = 0 / 360;
						const maxH = 10 / 360;
						h = clamp01(Math.min(maxH, Math.max(minH, h)));
						s = Math.max(s, 0.9);
						v = Math.max(v, 0.8);
					} else {
						// Bright reds: keep vivid but avoid over-clipping
						s = Math.max(s, 0.9);
						v = Math.min(v, 0.98);
					}
				}
			}
		}

		// Refined handling for dark and mid blues on black backgrounds (no CLI param; default behavior)
		{
			const hueDeg = h * 360;
			const inBlue = hueDeg >= 190 && hueDeg <= 280;
			if (inBlue) {
				if (v < 0.6 || lum < 0.28) {
					// Very dark blues: nudge toward teal for contrast and raise brightness
					// Target hue ~195-205° (0.54-0.57)
					const targetH = 200 / 360;
					// Interpolate a bit to keep some original character
					h = clamp01(h * 0.4 + targetH * 0.6);
					s = Math.max(s, 0.92);
					v = Math.max(v, 0.88);
				} else if (v < 0.8) {
					// Mid blues: keep in electric blue range, boost S/V
					const minH = 205 / 360;
					const maxH = 225 / 360;
					// Clamp hue into [205°,225°]
					h = clamp01(Math.min(maxH, Math.max(minH, h)));
					s = Math.max(s, 0.95);
					v = Math.max(v, 0.85);
				} else {
					// Bright blues: retain hue, preserve saturation, cap V lightly
					s = Math.max(s, 0.9);
					v = Math.min(v, 0.98);
				}
			}
		}

		// Convert HSV to a candidate RGB first
		let [cr, cg, callback] = hsvToRgb(clamp01(h), clamp01(s), clamp01(v));

		// Perceptual distance-based contrast boost in OKLab (keeps hue by scaling chroma uniformly)
		{
			let [Lk, Ak, Bk] = rgbToOklab(cr, cg, callback);
			const C = Math.hypot(Ak, Bk);
			const dBlack = Lk; // 0..1 perceptual distance to black in OKLab

			// Strength to lift dark colors away from black, reduced where local detail is high
			const darkK = clamp01((0.5 - dBlack) / 0.5); // 1 at black, 0 at mid and above
			const kL = 0.75 * (1 - preserveK) * darkK; // avoid lifting in detailed regions
			const targetL = 0.86;
			Lk = Math.min(0.98, Lk + (targetL - Lk) * kL);

			// Chroma boost: increase perceptual chroma when it’s too low, scaled by lack of detail
			const lowC = clamp01((0.16 - C) / 0.16); // 1 when C=0, 0 when C>=0.16
			const kC = 0.6 * (1 - preserveK) * lowC * (s > 0.25 ? 1 : 0.6);
			const targetC = 0.22;
			const newC = C + (targetC - C) * kC;
			if (newC > C + 1e-6) {
				if (C > 1e-8) {
					const scale = newC / C;
					Ak *= scale;
					Bk *= scale; // scale chroma uniformly to preserve hue
				} else {
					// No chroma: create a tiny chroma aligned to current HSV hue to avoid arbitrary hue drift
					const ang = h * 2 * Math.PI;
					Ak = Math.cos(ang) * newC;
					Bk = Math.sin(ang) * newC;
				}
			}

			// Convert back to sRGB
			[cr, cg, callback] = oklabToRgb(Lk, Ak, Bk);
		}

		// Final safeguard: eliminate dark blue/cyan/violet on black backgrounds, even after quantization
		{
			let [fh, fs, fv] = rgbToHsv(clamp01(cr), clamp01(cg), clamp01(callback));
			const hueDeg = fh * 360;
			const inBlueBand = (hueDeg >= 190 && hueDeg <= 300); // cyan→blue→violet range
			const [Lk2] = rgbToOklab(clamp01(cr), clamp01(cg), clamp01(callback));
			if (inBlueBand) {
				const targetH = 205 / 360; // electric blue
				const deepBlue = hueDeg >= 230; // indigo/violet side
				const needHueNudge = deepBlue || Lk2 < 0.68;
				if (needHueNudge) {
					fh = clamp01(fh * 0.15 + targetH * 0.85);
				}
				// Force vivid and bright to survive 256-color quantization on dark canvas
				fs = Math.max(fs, 0.95);
				fv = Math.max(fv, 0.94);
				[cr, cg, callback] = hsvToRgb(fh, fs, fv);
			}
		}

		// Warm-band safeguard: eliminate dark brown/muddy reds/oranges on black backgrounds
		{
			let [fh, fs, fv] = rgbToHsv(clamp01(cr), clamp01(cg), clamp01(callback));
			const hueDeg = fh * 360;
			const inWarmBand = (hueDeg >= 10 && hueDeg <= 50); // red→orange→amber
			const [Lk2] = rgbToOklab(clamp01(cr), clamp01(cg), clamp01(callback));
			if (inWarmBand) {
				// Detect too dark/muddy warm hues likely to look like brown on black
				const tooDark = fv < 0.62 || Lk2 < 0.55;
				if (tooDark) {
					// Nudge hue depending on side and option: with avoidDarkRed, push reds to orange (~30°)
					const targetH = (((options?.avoidDarkRed) || hueDeg >= 26) ? 30 : 16) / 360;
					fh = clamp01(fh * 0.3 + targetH * 0.7);
					fs = Math.max(fs, 0.95);
					fv = Math.max(fv, 0.93);
				} else if (fv < 0.8) {
					// Mid browns/oranges: clamp into vivid amber band and boost
					const minH = 28 / 360;
					const maxH = 36 / 360;
					fh = clamp01(Math.min(maxH, Math.max(minH, fh)));
					fs = Math.max(fs, 0.95);
					fv = Math.max(fv, 0.92);
				} else {
					// Already bright: ensure saturation and avoid clipping
					fs = Math.max(fs, 0.9);
					fv = Math.min(fv, 0.98);
				}
				[cr, cg, callback] = hsvToRgb(fh, fs, fv);
			}
		}

		// Green-band safeguard (optional via --avoid-dark-green): lighten dark/muddy greens on black
		{
			if (options?.avoidDarkGreen) {
				let [fh, fs, fv] = rgbToHsv(clamp01(cr), clamp01(cg), clamp01(callback));
				const hueDeg = fh * 360;
				const inGreenBand = (hueDeg >= 80 && hueDeg <= 170); // yellow-green → emerald → spring green
				if (inGreenBand) {
					const [Lk2] = rgbToOklab(clamp01(cr), clamp01(cg), clamp01(callback));
					const tooDark = fv < 0.65 || Lk2 < 0.6;
					if (tooDark) {
						// Shift toward vivid lime/emerald and boost S/V to survive palette quantization
						const targetH = 118 / 360; // bright lime/emerald
						fh = clamp01(fh * 0.25 + targetH * 0.75);
						fs = Math.max(fs, 0.94);
						fv = Math.max(fv, 0.93);
					} else if (fv < 0.82) {
						// Mid greens: clamp into vivid safe band and boost
						const minH = 110 / 360;
						const maxH = 130 / 360;
						fh = clamp01(Math.min(maxH, Math.max(minH, fh)));
						fs = Math.max(fs, 0.94);
						fv = Math.max(fv, 0.9);
					} else {
						// Already bright: ensure saturation and cap V to avoid clipping
						fs = Math.max(fs, 0.9);
						fv = Math.min(fv, 0.985);
					}
					[cr, cg, callback] = hsvToRgb(fh, fs, fv);
				}
			}
		}

		out[index] = clamp255(cr * 255);
		out[index + 1] = clamp255(cg * 255);
		out[index + 2] = clamp255(callback * 255);
		// out[i+3] unchanged (alpha)
	}

	// Re-encode to PNG
	return await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
		.png()
		.toBuffer();
}
