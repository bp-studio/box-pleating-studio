import { defineConfig } from "eslint/config";
import pluginCompat from "eslint-plugin-compat";
import pluginJsDoc from "eslint-plugin-jsdoc";
import pluginMocha from "eslint-plugin-mocha";
import { createConfig, legacyPlugin } from "@mutsuntsai/eslint";

export default defineConfig([
	...createConfig({
		ignores: ["{build,coverage}/**", "lib/{lzma,optimizer}/*.js", "lib/optimizer/**/*.js", "src/app/gen/**"],
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
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/no-this-alias": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"max-lines-per-function": "off",
			"no-invalid-this": "off",
			"no-var": "off",
			"vars-on-top": "off",
		},
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
	// Tests
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		...pluginMocha.configs.recommended,
		files: ["test/**"],
	},
	{
		name: "General Tests",
		files: ["{test,e2e,tools}/**"],
		rules: {
			"@typescript-eslint/explicit-function-return-type": ["warn", {
				allowFunctionsWithoutTypeParameters: true,
			}],
			"@typescript-eslint/no-invalid-this": "off",
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"max-classes-per-file": "off",
			"max-lines-per-function": "off",
			"prefer-arrow-callback": "off",
		},
	},
	{
		name: "Mocha",
		files: ["test/**"],
		rules: {
			"mocha/prefer-arrow-callback": "warn",
			"mocha/no-exports": "off",
			"mocha/no-pending-tests": "off",
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
