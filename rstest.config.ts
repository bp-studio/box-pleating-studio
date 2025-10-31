import { defineConfig } from "@rstest/core";

export default defineConfig({
	setupFiles: [
		"test/utils/line.ts",
		"test/utils/path.ts",
	],
	include: ["test/specs/**/*.spec.ts"],
	source: {
		tsconfigPath: "test/tsconfig.json",
	},
	onConsoleLog: () => false,
});
