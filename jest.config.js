// https://github.com/thymikee/jest-preset-angular#brief-explanation-of-config
const tsJestPreset = require('jest-preset-angular/jest-preset').globals['ts-jest'];

module.exports = {
	preset: 'jest-preset-angular',
	roots: ['.'],
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
	modulePathIgnorePatterns: ['<rootDir>/local/', '<rootDir>/resources'],
	transformIgnorePatterns: ['node_modules/(?!(jest-test))'],
	globals: {
		'ts-jest': {
			...tsJestPreset,
			tsConfig: 'tsconfig.spec.json'
		}
	}
};
