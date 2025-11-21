import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

const CHANGELOG = path.join(projectRoot, "CHANGELOG.md");
const RELEASE = path.join(projectRoot, "RELEASELOG.md");

async function main() {
	let changelog;
	try {
		changelog = await readFile(CHANGELOG, "utf8");
	} catch (error) {
		console.error(`Failed to read ${CHANGELOG}:`, error);
		process.exitCode = 1;
		return;
	}

	const content = changelog.replaceAll("\r\n", "\n");
	const headingRegex = /^##\s.*$/gm;
	const matches = [...content.matchAll(headingRegex)];

	if (matches.length === 0) {
		console.error("No release headings (\"## \") found in CHANGELOG.md");
		process.exitCode = 1;
		return;
	}

	const firstHeading = matches[0];
	const startIndex = firstHeading.index;

	// Determine the end index: start of the next heading or EOF
	const secondHeading = matches[1];
	const endIndex = secondHeading ? secondHeading.index : content.length;

	const latestSection = `${content.slice(startIndex, endIndex).trimEnd()}\n`;

	try {
		await writeFile(RELEASE, latestSection, "utf8");
	} catch (error) {
		console.error(`Failed to write ${RELEASE}:`, error);
		process.exitCode = 1;
	}
}

main().catch(console.error);
