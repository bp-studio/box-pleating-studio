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
	coverage: {
		provider: "istanbul",
		exclude: [
			"**/lib/**",
			"**/test/**",
		],
		reporters: ["lcovonly", "text-summary"],
		thresholds: {
			branches: 95,
			lines: 95,
			functions: 95,
			statements: 95,
		},
	},
});
