import { defineConfig } from "eslint/config";
import pluginCompat from "eslint-plugin-compat";
import pluginJsDoc from "eslint-plugin-jsdoc";
import { createConfig, legacyPlugin } from "@mutsuntsai/eslint";

export default defineConfig([
	...createConfig({
		ignores: ["{build,coverage}/**", "lib/{lzma,optimizer}/**/*.js"],
		import: {
			files: ["**/*.{ts,vue}", "eslint.config.js"],
			project: [
				"src/app",
				"src/client",
				"src/core",
				"src/other/donate",
				"src/other/service",
				"test",
				"e2e",
				"tools",
			],
		},
		globals: {
			esm: ["test/mocha.env.js", "lib/**/*.js", "eslint.config.js", "gulpfile.js", "gulp/**"],
			browser: ["src/**"],
		},
		html: {
			"max-lines-per-function": "off",
			"no-invalid-this": "off",
			"no-unused-vars": "off",
			"no-var": "off",
			"vars-on-top": "off",
		},
		mocha: ["test/**"],
		playwright: ["e2e/**"],
		package: order => order.toSpliced(order.indexOf("version") + 1, 0, "app_version"),
	}),

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Compatibility
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		name: "Plugin:typescript-compat",
		files: ["src/**/*.{ts,vue}"],
		languageOptions: {
			parserOptions: {
				sourceType: "module",
				project: true,
				extraFileExtensions: [".vue"],
			},
		},
		plugins: {
			"typescript-compat": legacyPlugin("eslint-plugin-typescript-compat", "typescript-compat"),
		},
		rules: {
			"typescript-compat/compat": "error",
		},
	},
	{
		name: "Plugin:compat",
		...pluginCompat.configs["flat/recommended"],
		files: ["src/**"],
		settings: {
			polyfills: [
				"globalThis",
				"navigator.locks",
				"Array.flatMap",
				"Array.prototype.toReversed",
				"Array.prototype.flatMap",
				"Object.fromEntries",
				"ObjectConstructor.fromEntries",
				"PromiseConstructor.withResolvers",
				"scheduler",
			],
		},
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// JsDoc
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		name: "JsDoc",
		files: ["src/client/**", "src/core/**"],
		plugins: {
			jsdoc: pluginJsDoc,
		},
		rules: {
			"jsdoc/require-jsdoc": ["warn", {
				require: {
					ClassDeclaration: true,
					FunctionDeclaration: false,
				},
				enableFixer: false,
			}],
		},
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Specific scopes
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		name: "Data structures",
		files: ["src/shared/data/**"],
		rules: {
			eqeqeq: "warn", // See src/shared/data/README.md
		},
	},
	{
		name: "Polyfills",
		files: ["src/shared/polyfill/**"],
		rules: {
			"no-extend-native": "off",
		},
	},
]);
