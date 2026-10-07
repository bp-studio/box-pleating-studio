import { defineConfig } from "@rstest/core";

/** For running the render check. See README.md. */
export default defineConfig({
	include: ["tools/renderCheck/**/*.spec.ts"],
	source: {
		tsconfigPath: "tools/renderCheck/tsconfig.json",
	},
	testTimeout: 0,
});
