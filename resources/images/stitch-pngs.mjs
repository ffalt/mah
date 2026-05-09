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
			arguments_[key] = (next && !next.startsWith("--")) ? next : true;
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
	const m = /(-?\d*\.?\d+)/.exec(String(v));
	return m ? Number.parseFloat(m[1]) : null;
}

function execGroup(text, re) {
	return re.exec(text)?.[1];
}

function execFirstGroup(text, patterns) {
	for (const re of patterns) {
		const value = execGroup(text, re);
		if (value != null) {
			return value;
		}
	}
	return undefined;
}

function parseImages(svgText) {
	// Map id => {href,width,height,invert}
	const images = new Map();
	const imageRe = /<image\s+([^>]*?)\/>/g; // self-closing <image .../>
	let m;
	while ((m = imageRe.exec(svgText))) {
		const attributes = m[1];
		const id = execGroup(attributes, /id\s*=\s*"([^"]+)"/);
		const href = execFirstGroup(attributes, [/xlink:href\s*=\s*"([^"]+)"/, /href\s*=\s*"([^"]+)"/]);
		const width = unPx(execGroup(attributes, /width\s*=\s*"([^"]+)"/));
		const height = unPx(execGroup(attributes, /height\s*=\s*"([^"]+)"/));
		// Check class, style and filter attributes (support both double and single quotes)
		const classAttribute = execFirstGroup(attributes, [/\bclass\s*=\s*"([^"]*)"/, /\bclass\s*=\s*'([^']*)'/]) || "";
		const style = execFirstGroup(attributes, [/style\s*=\s*"([^"]*)"/, /style\s*=\s*'([^']*)'/]) || "";
		const filterAttribute = execFirstGroup(attributes, [/\bfilter\s*=\s*"([^"]*)"/, /\bfilter\s*=\s*'([^']*)'/]) || "";
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

function parseUses(svgText) {
	// Collect placement cells: {id, x, y, width, height, invert}
	const uses = [];
	const useRe = /<use\s+([^>]*?)\/>/g;
	let m;
	while ((m = useRe.exec(svgText))) {
		const attributes = m[1];
		const href = execFirstGroup(attributes, [/xlink:href\s*=\s*"#([^"]+)"/, /href\s*=\s*"#([^"]+)"/, /xlink:href\s*=\s*'#([^']+)'/, /href\s*=\s*'#([^']+)'/]);
		if (!href) {
			continue;
		}
		const x = unPx(execFirstGroup(attributes, [/\bx\s*=\s*"([^"]+)"/, /\bx\s*=\s*'([^']+)'/])) ?? 0;
		const y = unPx(execFirstGroup(attributes, [/\by\s*=\s*"([^"]+)"/, /\by\s*=\s*'([^']+)'/])) ?? 0;
		const width = unPx(execFirstGroup(attributes, [/width\s*=\s*"([^"]+)"/, /width\s*=\s*'([^']+)'/]));
		const height = unPx(execFirstGroup(attributes, [/height\s*=\s*"([^"]+)"/, /height\s*=\s*'([^']+)'/]));
		const classAttribute = execFirstGroup(attributes, [/\bclass\s*=\s*"([^"]*)"/, /\bclass\s*=\s*'([^']*)'/]) || "";
		const style = execFirstGroup(attributes, [/style\s*=\s*"([^"]*)"/, /style\s*=\s*'([^']*)'/]) || "";
		const filterAttribute = execFirstGroup(attributes, [/\bfilter\s*=\s*"([^"]*)"/, /\bfilter\s*=\s*'([^']*)'/]) || "";
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

function parseScaleTile(v) {
	if (v === undefined) {
		return true;
	}
	if (typeof v === "boolean") {
		return v;
	}
	const s = String(v).toLowerCase();
	return s === "1" || s === "true" || s === "yes" || s === "on";
}

function parseCellOverride(v) {
	if (v == null) {
		return null;
	}
	return Math.max(1, Math.round(Number.parseFloat(v)));
}

function buildConfig() {
	const arguments_ = parseArguments(process.argv);
	const svgPath = arguments_.svg;
	const imagesDirectory = arguments_.dir;
	const outPath = arguments_.out;
	if (!svgPath || !imagesDirectory || !outPath) {
		console.error("Missing required arguments. Usage:\n  node stitch-pngs.mjs --svg <file.svg> --dir <images_dir> --out <out.png>\nOptional: --bg, --scale, --cellWidth/--cellHeight, --colors256, --oxipng, --oxipngArgs");
		return null;
	}
	const forcedCellW = arguments_.cellWidth ?? arguments_.cellW ?? arguments_.width;
	const forcedCellH = arguments_.cellHeight ?? arguments_.cellH ?? arguments_.height;
	return {
		svgPath,
		imagesDirectory,
		outPath,
		bg: arguments_.bg || "#00000000",
		scale: arguments_.scale ? Number.parseFloat(arguments_.scale) : 1,
		pad: arguments_.pad ? Number.parseFloat(arguments_.pad) : 0,
		wantOxipng: !!arguments_.oxipng,
		oxiArguments: (arguments_.oxipngArgs && String(arguments_.oxipngArgs).trim().length > 0) ? String(arguments_.oxipngArgs).split(/\s+/) : [],
		useColors256: !!arguments_.colors256,
		debug: !!arguments_.debug,
		avoidDarkRed: !!(arguments_.avoidDarkRed || arguments_["avoid-dark-red"]),
		avoidDarkGreen: !!(arguments_.avoidDarkGreen || arguments_["avoid-dark-green"]),
		scaleTile: parseScaleTile(arguments_["scale-tile"] ?? arguments_.scaleTile),
		cellWOverride: parseCellOverride(forcedCellW),
		cellHOverride: parseCellOverride(forcedCellH)
	};
}

async function loadSvgLayout(svgPath) {
	const svgText = await fs.readFile(svgPath, "utf8");
	return { imageDefs: parseImages(svgText), uses: parseUses(svgText) };
}

function buildOffsets(sizes) {
	const offsets = Array.from({ length: sizes.length }).fill(0);
	for (let index = 1; index < sizes.length; index++) {
		offsets[index] = offsets[index - 1] + sizes[index - 1];
	}
	return offsets;
}

function buildGeometry(uses, imageDefs, config) {
	const uniqueX = [...new Set(uses.map(u => u.x))].sort((a, b) => a - b);
	const uniqueY = [...new Set(uses.map(u => u.y))].sort((a, b) => a - b);
	const xToCol = new Map(uniqueX.map((x, index) => [x, index]));
	const yToRow = new Map(uniqueY.map((y, index) => [y, index]));
	const colWidths = Array.from({ length: uniqueX.length }).fill(config.cellWOverride ?? MIN_CELL_W);
	const rowHeights = Array.from({ length: uniqueY.length }).fill(config.cellHOverride ?? MIN_CELL_H);

	if (config.cellWOverride == null || config.cellHOverride == null) {
		for (const u of uses) {
			const definition = imageDefs.get(u.id);
			const col = xToCol.get(u.x);
			const row = yToRow.get(u.y);
			const baseCellW = config.cellWOverride ?? (u.width ?? definition?.width ?? MIN_CELL_W);
			const baseCellH = config.cellHOverride ?? (u.height ?? definition?.height ?? MIN_CELL_H);
			if (config.cellWOverride == null && col != null) {
				colWidths[col] = Math.max(colWidths[col], Math.max(baseCellW, MIN_CELL_W));
			}
			if (config.cellHOverride == null && row != null) {
				rowHeights[row] = Math.max(rowHeights[row], Math.max(baseCellH, MIN_CELL_H));
			}
		}
	}

	const colOffsets = buildOffsets(colWidths);
	const rowOffsets = buildOffsets(rowHeights);
	const totalWUnits = colWidths.reduce((a, b) => a + b, 0);
	const totalHUnits = rowHeights.reduce((a, b) => a + b, 0);
	const canvasW = Math.ceil((totalWUnits + config.pad + config.pad) * config.scale);
	const canvasH = Math.ceil((totalHUnits + config.pad + config.pad) * config.scale);

	return { xToCol, yToRow, colWidths, rowHeights, colOffsets, rowOffsets, canvasW, canvasH };
}

async function resolveTileFilePath(u, imageDefinition, imagesDirectory) {
	if (imageDefinition) {
		const fileRelative = imageDefinition.href.replace(/^\.\//, "");
		let filePath = fileRelative;
		if (!path.isAbsolute(filePath)) {
			filePath = path.resolve(imagesDirectory, path.basename(fileRelative));
		}
		try {
			await fs.access(filePath);
			return { filePath, usedFallback: false, usedFallbackReason: null };
		} catch {
			console.warn(`[skip] File not found for ${u.id}: ${filePath}`);
			return null;
		}
	}

	const candidate = path.resolve(imagesDirectory, `${u.id}.png`);
	try {
		await fs.access(candidate);
		return { filePath: candidate, usedFallback: true, usedFallbackReason: "direct" };
	} catch {
		if (!u.id.startsWith("t_")) {
			console.warn(`[skip] No <image id="${u.id}"> found and no fallback file ${candidate}`);
			return null;
		}
		const candidate2 = path.resolve(imagesDirectory, `${u.id.slice(2)}.png`);
		try {
			await fs.access(candidate2);
			return { filePath: candidate2, usedFallback: true, usedFallbackReason: "stripped" };
		} catch {
			console.warn(`[skip] No <image id="${u.id}"> found and no fallback file ${candidate} or ${candidate2}`);
			return null;
		}
	}
}

function fitSizeInCell(intrinsicW, intrinsicH, cellW, cellH, scale, scaleTile) {
	const scaledW = Math.max(1, Math.round(intrinsicW * (scale || 1)));
	const scaledH = Math.max(1, Math.round(intrinsicH * (scale || 1)));
	let targetW = scaledW;
	let targetH = scaledH;
	const shouldResizeToCell = (scaledW > cellW || scaledH > cellH) || (scaleTile && (scaledW < cellW || scaledH < cellH));
	if (shouldResizeToCell) {
		const factor = Math.min(cellW / scaledW, cellH / scaledH);
		targetW = Math.max(1, Math.floor(scaledW * factor));
		targetH = Math.max(1, Math.floor(scaledH * factor));
	}
	return { targetW, targetH };
}

async function createResizedInputBuffer(filePath, intrinsicW, intrinsicH, targetW, targetH, scaleTile) {
	if (targetW !== intrinsicW || targetH !== intrinsicH) {
		const allowEnlarge = scaleTile || (targetW <= intrinsicW && targetH <= intrinsicH);
		return sharp(filePath)
			.resize({ width: targetW, height: targetH, fit: "inside", withoutEnlargement: !allowEnlarge })
			.toBuffer();
	}
	return fs.readFile(filePath);
}

async function prepareTileBuffer(filePath, imageDefinition, prePlacement, config) {
	const meta = await sharp(filePath).metadata();
	const intrinsicW = meta.width || imageDefinition?.width || prePlacement.cellW;
	const intrinsicH = meta.height || imageDefinition?.height || prePlacement.cellH;
	const { targetW, targetH } = fitSizeInCell(intrinsicW, intrinsicH, prePlacement.cellW, prePlacement.cellH, config.scale, config.scaleTile);
	const inputBuf = await createResizedInputBuffer(filePath, intrinsicW, intrinsicH, targetW, targetH, config.scaleTile);
	return { inputBuf, targetW, targetH };
}

async function maybeApplyInvert(inputBuf, u, imageDefinition, config) {
	const shouldInvert = !!(u.invert || imageDefinition?.invert);
	if (config.debug) {
		const invertSource = [u.invert ? "use" : null, imageDefinition?.invert ? "image" : null].filter(Boolean).join("+") || "none";
		console.log(`[tile] ${u.id} invert=${shouldInvert} (source: ${invertSource})`);
	}
	if (!shouldInvert) {
		return inputBuf;
	}
	try {
		return await applyDarkBgColormap(inputBuf, { avoidDarkRed: config.avoidDarkRed, avoidDarkGreen: config.avoidDarkGreen });
	} catch (error) {
		console.warn(`[warn] Failed to apply dark colormap to ${u.id}:`, error?.message || error);
		return inputBuf;
	}
}

function computeTilePlacement(u, geometry, sourceW, sourceH, config) {
	const col = geometry.xToCol.get(u.x);
	const row = geometry.yToRow.get(u.y);
	const cellWUnits = geometry.colWidths[col] ?? MIN_CELL_W;
	const cellHUnits = geometry.rowHeights[row] ?? MIN_CELL_H;
	const cellW = Math.round(cellWUnits * config.scale);
	const cellH = Math.round(cellHUnits * config.scale);
	const left = Math.floor(((config.pad + geometry.colOffsets[col]) * config.scale) + (cellW - sourceW) / 2);
	const top = Math.floor(((config.pad + geometry.rowOffsets[row]) * config.scale) + (cellH - sourceH) / 2);
	return { left, top, cellW, cellH };
}

async function buildCompositeForUse(u, imageDefs, geometry, config) {
	const imageDefinition = imageDefs.get(u.id);
	const source = await resolveTileFilePath(u, imageDefinition, config.imagesDirectory);
	if (!source) {
		return null;
	}
	if (source.usedFallback) {
		const note = source.usedFallbackReason === "stripped" ? " (stripped t_)" : "";
		console.log(`[fallback] Using ${path.relative(process.cwd(), source.filePath)} for ${u.id}${note}`);
	}

	const prePlacement = computeTilePlacement(u, geometry, 0, 0, config);
	const { inputBuf: initialBuffer, targetW, targetH } = await prepareTileBuffer(source.filePath, imageDefinition, prePlacement, config);
	const inputBuf = await maybeApplyInvert(initialBuffer, u, imageDefinition, config);

	const rmeta = await sharp(inputBuf).metadata();
	const sourceW = rmeta.width || targetW;
	const sourceH = rmeta.height || targetH;
	const { left, top } = computeTilePlacement(u, geometry, sourceW, sourceH, config);
	return { input: inputBuf, left, top };
}

async function writeOutputPng(outPath, canvasW, canvasH, composites, bg, useColors256) {
	await ensureDirectory(outPath);
	const canvas = sharp({ create: { width: Math.max(1, canvasW), height: Math.max(1, canvasH), channels: 4, background: bg } });
	const pngOptions = useColors256 ? { palette: true, colors: 256, dither: 1 } : {};
	await canvas.composite(composites).png(pngOptions).toFile(outPath);
}

async function main() {
	const config = buildConfig();
	if (!config) {
		process.exitCode = 1;
		return;
	}

	const { imageDefs, uses } = await loadSvgLayout(config.svgPath);
	if (uses.length === 0) {
		console.error("No <use> elements found in", config.svgPath);
		process.exitCode = 2;
		return;
	}

	const geometry = buildGeometry(uses, imageDefs, config);
	const composites = [];
	let missing = 0;
	let placed = 0;

	for (const u of uses) {
		const composite = await buildCompositeForUse(u, imageDefs, geometry, config);
		if (!composite) {
			missing++;
			continue;
		}
		composites.push(composite);
		placed++;
	}

	await writeOutputPng(config.outPath, geometry.canvasW, geometry.canvasH, composites, config.bg, config.useColors256);
	console.log(`Stitched ${placed} tiles into ${config.outPath}`);
	if (missing) {
		console.warn(`Missing/Skipped: ${missing}`);
	}
	if (config.wantOxipng) {
		const ok = await runOxipng(config.outPath, config.oxiArguments);
		if (ok) {
			console.log("oxipng optimization completed");
		}
	}
}

function clamp01(x) {
	return x < 0 ? 0 : (Math.min(x, 1));
}

function clamp255(x) {
	return x < 0 ? 0 : (x > 255 ? 255 : Math.trunc(x));
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

function srgbToLinear(u) {
	return u <= 0.040_45 ? u / 12.92 : ((u + 0.055) / 1.055 ** 2.4);
}

function linearToSrgb(u) {
	return u <= 0.003_130_8 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;
}

function rgbToOklab(r, g, b) {
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
	r = r < 0 ? 0 : (Math.min(r, 1));
	g = g < 0 ? 0 : (Math.min(g, 1));
	b = b < 0 ? 0 : (Math.min(b, 1));
	return [r, g, b];
}

function buildLuminanceMaps(out, width, height) {
	const stride = 4;
	const lumArray = new Float32Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * stride;
			const a = out[index + 3];
			if (a <= 1) {
				lumArray[y * width + x] = 0;
				continue;
			}
			const r = out[index] / 255;
			const g = out[index + 1] / 255;
			const b = out[index + 2] / 255;
			lumArray[y * width + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}
	}
	const rangeArray = new Float32Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let lo = 1;
			let hi = 0;
			for (let dy = -1; dy <= 1; dy++) {
				const yy = y + dy;
				if (yy < 0 || yy >= height) {
					continue;
				}
				for (let dx = -1; dx <= 1; dx++) {
					const xx = x + dx;
					if (xx < 0 || xx >= width) {
						continue;
					}
					const v = lumArray[yy * width + xx];
					if (v < lo) {
						lo = v;
					}
					if (v > hi) {
						hi = v;
					}
				}
			}
			rangeArray[y * width + x] = hi - lo;
		}
	}
	return rangeArray;
}

function refineBaseHsv(h, s, v, lum, preserveK, adjustK) {
	let nextH = h;
	let nextS = s;
	let nextV = v;
	if ((lum <= 0.06 || v <= 0.06) && s <= 0.2) {
		return { forceWhite: true, h: nextH, s: nextS, v: nextV };
	}
	if (s < 0.25) {
		const t = lum;
		const targetH = t < 0.33 ? 0.55 : (t < 0.66 ? 0.33 : 0.1);
		nextH = h * (0.2 + 0.3 * preserveK) + targetH * (0.8 - 0.3 * preserveK);
		nextS = clamp01(s + (0.9 - s) * (0.7 * adjustK));
		const baseTargetV = 0.88 - 0.1 * (1 - t);
		nextV = clamp01(v + (baseTargetV - v) * (0.6 * adjustK));
	} else {
		const targetS = Math.max(0.75, Math.min(1, s * 1.15));
		nextS = clamp01(s + (targetS - s) * (0.6 * adjustK));
		const liftV = v < 0.6 ? 0.78 : Math.min(1, v * 0.95 + 0.05);
		nextV = clamp01(v + (liftV - v) * (0.6 * adjustK));
	}
	if (lum < 0.2) {
		nextV = Math.max(nextV, 0.75 * (0.5 * adjustK) + nextV * (1 - 0.5 * adjustK));
		nextS = Math.max(nextS, 0.85 * (0.5 * adjustK) + nextS * (1 - 0.5 * adjustK));
	}
	return { forceWhite: false, h: nextH, s: nextS, v: nextV };
}

function tuneReds(h, s, v, lum, options) {
	let nextH = h;
	let nextS = s;
	let nextV = v;
	const hueDeg = nextH * 360;
	const inRed = (hueDeg <= 15 || hueDeg >= 345);
	if (!inRed) {
		return { h: nextH, s: nextS, v: nextV };
	}
	const preferOrange = !!(options?.avoidDarkRed);
	if (preferOrange) {
		nextH = clamp01(nextH * 0.15 + (30 / 360) * 0.85);
		nextS = Math.max(nextS, 0.95);
		nextV = Math.max(nextV, 0.92);
		return { h: nextH, s: nextS, v: nextV };
	}
	if (nextS < 0.5) {
		return { h: nextH, s: nextS, v: nextV };
	}
	if (nextV < 0.6 || lum < 0.28) {
		nextH = clamp01(Math.min(10 / 360, Math.max(0, nextH)));
		nextS = Math.max(nextS, 0.92);
		nextV = Math.max(nextV, 0.86);
		return { h: nextH, s: nextS, v: nextV };
	}
	if (nextV < 0.8) {
		nextH = clamp01(Math.min(10 / 360, Math.max(0, nextH)));
		nextS = Math.max(nextS, 0.9);
		nextV = Math.max(nextV, 0.8);
		return { h: nextH, s: nextS, v: nextV };
	}
	nextS = Math.max(nextS, 0.9);
	nextV = Math.min(nextV, 0.98);
	return { h: nextH, s: nextS, v: nextV };
}

function tuneBlues(h, s, v, lum) {
	let nextH = h;
	let nextS = s;
	let nextV = v;
	const hueDeg = nextH * 360;
	if (hueDeg < 190 || hueDeg > 280) {
		return { h: nextH, s: nextS, v: nextV };
	}
	if (nextV < 0.6 || lum < 0.28) {
		nextH = clamp01(nextH * 0.4 + (200 / 360) * 0.6);
		nextS = Math.max(nextS, 0.92);
		nextV = Math.max(nextV, 0.88);
		return { h: nextH, s: nextS, v: nextV };
	}
	if (nextV < 0.8) {
		nextH = clamp01(Math.min(225 / 360, Math.max(205 / 360, nextH)));
		nextS = Math.max(nextS, 0.95);
		nextV = Math.max(nextV, 0.85);
		return { h: nextH, s: nextS, v: nextV };
	}
	nextS = Math.max(nextS, 0.9);
	nextV = Math.min(nextV, 0.98);
	return { h: nextH, s: nextS, v: nextV };
}

function applyOklabContrastBoost(cr, cg, callback, h, s, preserveK) {
	let [Lk, Ak, Bk] = rgbToOklab(cr, cg, callback);
	const C = Math.hypot(Ak, Bk);
	const darkK = clamp01((0.5 - Lk) / 0.5);
	const targetL = 0.86;
	Lk = Math.min(0.98, Lk + (targetL - Lk) * (0.75 * (1 - preserveK) * darkK));
	const lowC = clamp01((0.16 - C) / 0.16);
	const newC = C + (0.22 - C) * (0.6 * (1 - preserveK) * lowC * (s > 0.25 ? 1 : 0.6));
	if (newC > C + 1e-6) {
		if (C > 1e-8) {
			const scale = newC / C;
			Ak *= scale;
			Bk *= scale;
		} else {
			const ang = h * 2 * Math.PI;
			Ak = Math.cos(ang) * newC;
			Bk = Math.sin(ang) * newC;
		}
	}
	return oklabToRgb(Lk, Ak, Bk);
}

function applyBlueSafeguard(cr, cg, callback) {
	let [fh, fs, fv] = rgbToHsv(clamp01(cr), clamp01(cg), clamp01(callback));
	const hueDeg = fh * 360;
	const inBlueBand = (hueDeg >= 190 && hueDeg <= 300);
	if (!inBlueBand) {
		return [cr, cg, callback];
	}
	const [Lk2] = rgbToOklab(clamp01(cr), clamp01(cg), clamp01(callback));
	if (hueDeg >= 230 || Lk2 < 0.68) {
		fh = clamp01(fh * 0.15 + (205 / 360) * 0.85);
	}
	fs = Math.max(fs, 0.95);
	fv = Math.max(fv, 0.94);
	return hsvToRgb(fh, fs, fv);
}

function applyWarmSafeguard(cr, cg, callback, options) {
	let [fh, fs, fv] = rgbToHsv(clamp01(cr), clamp01(cg), clamp01(callback));
	const hueDeg = fh * 360;
	if (hueDeg < 10 || hueDeg > 50) {
		return [cr, cg, callback];
	}
	const [Lk2] = rgbToOklab(clamp01(cr), clamp01(cg), clamp01(callback));
	if (fv < 0.62 || Lk2 < 0.55) {
		const targetH = (((options?.avoidDarkRed) || hueDeg >= 26) ? 30 : 16) / 360;
		fh = clamp01(fh * 0.3 + targetH * 0.7);
		fs = Math.max(fs, 0.95);
		fv = Math.max(fv, 0.93);
		return hsvToRgb(fh, fs, fv);
	}
	if (fv < 0.8) {
		fh = clamp01(Math.min(36 / 360, Math.max(28 / 360, fh)));
		fs = Math.max(fs, 0.95);
		fv = Math.max(fv, 0.92);
		return hsvToRgb(fh, fs, fv);
	}
	fs = Math.max(fs, 0.9);
	fv = Math.min(fv, 0.98);
	return hsvToRgb(fh, fs, fv);
}

function applyGreenSafeguard(cr, cg, callback, options) {
	if (!options?.avoidDarkGreen) {
		return [cr, cg, callback];
	}
	let [fh, fs, fv] = rgbToHsv(clamp01(cr), clamp01(cg), clamp01(callback));
	const hueDeg = fh * 360;
	if (hueDeg < 80 || hueDeg > 170) {
		return [cr, cg, callback];
	}
	const [Lk2] = rgbToOklab(clamp01(cr), clamp01(cg), clamp01(callback));
	if (fv < 0.65 || Lk2 < 0.6) {
		fh = clamp01(fh * 0.25 + (118 / 360) * 0.75);
		fs = Math.max(fs, 0.94);
		fv = Math.max(fv, 0.93);
		return hsvToRgb(fh, fs, fv);
	}
	if (fv < 0.82) {
		fh = clamp01(Math.min(130 / 360, Math.max(110 / 360, fh)));
		fs = Math.max(fs, 0.94);
		fv = Math.max(fv, 0.9);
		return hsvToRgb(fh, fs, fv);
	}
	fs = Math.max(fs, 0.9);
	fv = Math.min(fv, 0.985);
	return hsvToRgb(fh, fs, fv);
}

async function applyDarkBgColormap(inputBuf, options = {}) {
	const { data, info } = await sharp(inputBuf)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const out = Buffer.from(data);
	const rangeArray = buildLuminanceMaps(out, info.width, info.height);
	for (let index = 0; index < out.length; index += 4) {
		const a = out[index + 3];
		if (a <= 1) {
			continue;
		}
		const p = index >> 2;
		const preserveK = Math.max(0, Math.min(1, rangeArray[p] / 0.08));
		const adjustK = 1 - preserveK;
		const r = out[index] / 255;
		const g = out[index + 1] / 255;
		const b = out[index + 2] / 255;
		const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		let [h, s, v] = rgbToHsv(r, g, b);
		const base = refineBaseHsv(h, s, v, lum, preserveK, adjustK);
		if (base.forceWhite) {
			out[index] = 255;
			out[index + 1] = 255;
			out[index + 2] = 255;
			continue;
		}
		({ h, s, v } = tuneReds(base.h, base.s, base.v, lum, options));
		({ h, s, v } = tuneBlues(h, s, v, lum));
		let [cr, cg, callback] = hsvToRgb(clamp01(h), clamp01(s), clamp01(v));
		[cr, cg, callback] = applyOklabContrastBoost(cr, cg, callback, h, s, preserveK);
		[cr, cg, callback] = applyBlueSafeguard(cr, cg, callback);
		[cr, cg, callback] = applyWarmSafeguard(cr, cg, callback, options);
		[cr, cg, callback] = applyGreenSafeguard(cr, cg, callback, options);
		out[index] = clamp255(cr * 255);
		out[index + 1] = clamp255(cg * 255);
		out[index + 2] = clamp255(callback * 255);
	}
	return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
		.png()
		.toBuffer();
}

main().catch(error => {
	console.error("stitch-picasso failed:", error?.stack || error);
	process.exitCode = 1;
});
