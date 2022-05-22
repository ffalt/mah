module.exports = {
	preset: 'jest-preset-angular',
	transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
	globals: {
		APP_VERSION: 'TEST',
		APP_NAME: 'TEST MAHJONG',
		APP_FEATURE_EDITOR: 'true'
	},
};
