import { defineConfig } from "@rstest/core";

/** For running the optimizer benchmark. See README.md. */
export default defineConfig({
	include: ["tools/optimizerBench/**/*.bench.ts"],
	source: {
		tsconfigPath: "tools/optimizerBench/tsconfig.json",
	},
	testTimeout: 0,
	disableConsoleIntercept: true,
});
