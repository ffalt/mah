module.exports = {
	preset: 'jest-preset-angular',
	transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts']
};
