import { defineConfig } from "@rsbuild/core";

if(process.env.NODE_ENV === "production") {
	throw new Error("Please run this tool only in dev mode.");
}

/** For building polyBool tool. Run with `pnpm tools`. */
export default defineConfig({
	source: {
		entry: {
			index: "./tools/polyBool/index.ts",
		},
		tsconfigPath: "./tools/tsconfig.json",
	},
	html: {
		template: "./tools/polyBool/index.htm",
	},
});
