import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [angular({ tsconfig: "./tsconfig.spec.json" })],
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
