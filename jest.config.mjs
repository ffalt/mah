export default {
	preset: "jest-preset-angular",
	transformIgnorePatterns: [String.raw`node_modules/(?!.*\.mjs$)`],
	testPathIgnorePatterns: ["/node_modules/", "/resources/"],
	setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
	globals: {
		APP_VERSION: "TEST",
		APP_NAME: "TEST MAHJONG",
		APP_FEATURE_EDITOR: "true",
		APP_FEATURE_KYODAI: "false",
		APP_FEATURE_MOBILE: "false"
	}
};
