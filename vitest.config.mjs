import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [angular({ tsconfig: "./tsconfig.spec.json" })],
	define: {
		APP_VERSION: JSON.stringify("TEST"),
		APP_NAME: JSON.stringify("TEST MAHJONG"),
		APP_FEATURE_EDITOR: JSON.stringify("true"),
		APP_FEATURE_KYODAI: JSON.stringify("false"),
		APP_FEATURE_MOBILE: JSON.stringify("false")
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./setup-vitest.ts"],
		mockReset: true,
		coverage: {
			reportsDirectory: "coverage"
		}
	}
});
