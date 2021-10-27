require('jest-preset-angular/ngcc-jest-processor');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
	preset: 'jest-preset-angular',
	testPathIgnorePatterns: ["/node_modules/", "/local/", "/dist/"],
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
};
