import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

function getStableRunDirectory(): string {
	if (process.env.PW_RESULTS_SUBDIR?.trim()) {
		return process.env.PW_RESULTS_SUBDIR.trim();
	}
	const resultsRoot = path.join(process.cwd(), 'results');
	const markerPath = path.join(resultsRoot, '.pw-run-id');
	if (fs.existsSync(markerPath)) {
		const existing = fs.readFileSync(markerPath, 'utf8').trim();
		if (existing) {
			return existing;
		}
	}
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	const folder = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
	// Ensure root exists, then write marker
	fs.mkdirSync(resultsRoot, { recursive: true });
	fs.writeFileSync(markerPath, folder, 'utf8');
	return folder;
}

const outputDirectory = path.join(process.cwd(), 'results', getStableRunDirectory());

export default defineConfig({
	testDir: 'specs',
	retries: 1,
	fullyParallel: true,
	timeout: 40_000,
	// Put all artifacts of this run under results/<date-time>/
	outputDir: outputDirectory,
	use: {
		baseURL: 'http://localhost:4200',
		trace: 'on-first-retry',
		screenshot: 'on-first-failure',
		video: 'retain-on-failure'
	},
	reporter: [
		['list'],
		['./reporters/flat-screenshots-reporter.js']
	],
	webServer: {
		command: 'cd ../../ && npm run start:development',
		url: 'http://localhost:4200',
		reuseExistingServer: true,
		timeout: 120_000
	},
	projects: [
		{
			name: 'desktop-light',
			outputDir: outputDirectory,
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1600, height: 1000 },
				colorScheme: 'light'
			}
		},
		{
			name: 'desktop-dark',
			outputDir: outputDirectory,
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1600, height: 1000 },
				colorScheme: 'dark'
			}
		},
		{
			name: 'embed',
			outputDir: outputDirectory,
			use: {
				...devices['Desktop Firefox'],
				viewport: { width: 1000, height: 780 },
				colorScheme: 'light'
			}
		},
		{
			name: 'tablet-light',
			outputDir: outputDirectory,
			use: {
				...devices['iPad (gen 7) landscape'],
				colorScheme: 'light'
			}
		},
		{
			name: 'tablet-dark',
			outputDir: outputDirectory,
			use: {
				...devices['iPad (gen 7) landscape'],
				colorScheme: 'dark'
			}
		},
		{
			name: 'mobile-light',
			outputDir: outputDirectory,
			use: {
				...devices['Pixel 5'],
				colorScheme: 'light'
			}
		},
		{
			name: 'mobile-dark',
			outputDir: outputDirectory,
			use: {
				...devices['Pixel 5'],
				colorScheme: 'dark'
			}
		},
		{
			name: 'mini',
			outputDir: outputDirectory,
			use: {
				...devices['Galaxy S9+'],
				colorScheme: 'light'
			}
		}
	]
});
