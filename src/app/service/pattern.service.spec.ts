import fs from 'node:fs';
import path from 'node:path';

import { generatePatternList } from './pattern.service';

function getPatternsDirectory(): string {
	// This spec file lives in src/app/service -> assets is at src/assets
	return path.resolve(__dirname, '../../assets/patterns');
}

function listJsonBaseNames(directory: string): Array<string> {
	const files = fs.readdirSync(directory, { withFileTypes: true });
	return files
		.filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
		.map(entry => entry.name.replace(/\.json$/i, ''))
		.sort();
}

describe('generatePatternList vs assets/patterns/*.json', () => {
	const patternsDirectory = getPatternsDirectory();
	const filesystemIds = new Set(listJsonBaseNames(patternsDirectory));
	const generated = generatePatternList();
	const generatedIds = new Set(generated.map(p => p.id));

	it('has a JSON file for every generated id', () => {
		const missingFiles: Array<string> = [];
		for (const id of generatedIds) {
			if (!filesystemIds.has(id)) {
				missingFiles.push(`${id}.json`);
			}
		}
		expect(missingFiles).toEqual([]);
	});

	it('includes every JSON file in the generated list', () => {
		const notListed: Array<string> = [];
		for (const id of filesystemIds) {
			if (!generatedIds.has(id)) {
				notListed.push(id);
			}
		}
		expect(notListed).toEqual([]);
	});
});
