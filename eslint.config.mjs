import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig } from "eslint/config";
import { fileURLToPath } from "url";
import { fixupPluginRules } from "@eslint/compat";
import path from "path";
import globals from "globals";
import pluginCompat from "eslint-plugin-compat";
import pluginHtml from "eslint-plugin-html";
import pluginJs from "@eslint/js";
import pluginJsDoc from "eslint-plugin-jsdoc";
import pluginMocha from "eslint-plugin-mocha";
import pluginTs from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import pluginImport from "eslint-plugin-import";
import stylistic from "@mutsuntsai/stylistic";

import pluginLocal from "./eslint-local-rules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });
function legacyPlugin(name, alias = name) {
	const plugin = compat.plugins(name)[0]?.plugins?.[alias];
	if(!plugin) throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
	return fixupPluginRules(plugin);
}

export default defineConfig([
	{
		name: "Global ignores",
		ignores: ["{build,coverage}/**", "lib/**/*.js", "lib/optimizer/**/*.mjs", "src/app/gen/**"],
	},
	{
		name: "Matching file extensions",
		files: ["**/*.{ts,vue,htm,html}"],
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// General rules
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		name: "Default",
		...pluginJs.configs.recommended,
	},
	...stylistic,
	{
		name: "General rules",
		rules: {
			"array-callback-return": "warn",
			"arrow-body-style": "warn",
			"block-scoped-var": "warn",
			"complexity": "warn",
			"curly": ["warn", "multi-line", "consistent"],
			"default-case": "warn",
			"default-case-last": "warn",
			"default-param-last": "warn",
			"dot-notation": "warn",
			"func-name-matching": "warn",
			"grouped-accessor-pairs": "warn",
			"id-denylist": "warn",
			"id-match": "warn",
			"max-classes-per-file": "warn",
			"max-depth": "warn",
			"max-lines": ["warn", { skipBlankLines: true, skipComments: true }],
			"max-lines-per-function": ["warn", { skipComments: true }],
			"max-nested-callbacks": "warn",
			"max-params": ["warn", 6],
			"new-cap": "warn",
			"no-alert": "warn",
			"no-array-constructor": "warn",
			"no-await-in-loop": "warn",
			"no-caller": "warn",
			"no-cond-assign": "off",
			"no-constant-binary-expression": "off",
			"no-constant-condition": ["warn", { checkLoops: false }],
			"no-constructor-return": "warn",
			"no-debugger": "off",
			"no-div-regex": "warn",
			"no-duplicate-imports": "warn",
			"no-empty": ["warn", { allowEmptyCatch: true }],
			"no-empty-function": "warn",
			"no-eval": "warn",
			"no-extend-native": "warn",
			"no-extra-bind": "warn",
			"no-extra-label": "warn",
			"no-implicit-coercion": "warn",
			"no-implied-eval": "warn",
			"no-invalid-this": "error",
			"no-iterator": "warn",
			"no-label-var": "warn",
			"no-labels": "error",
			"no-lone-blocks": "warn",
			"no-loop-func": "warn",
			"no-loss-of-precision": "off",
			"no-multi-str": "error",
			"no-nested-ternary": "warn",
			"no-new-func": "warn",
			"no-new-wrappers": "warn",
			"no-object-constructor": "warn",
			"no-octal-escape": "warn",
			"no-proto": "warn",
			"no-restricted-exports": "warn",
			"no-restricted-globals": "warn",
			"no-restricted-imports": "warn",
			"no-restricted-properties": "warn",
			"no-restricted-syntax": "warn",
			"no-script-url": "warn",
			"no-self-compare": "warn",
			"no-sequences": "warn",
			"no-shadow": "warn",
			"no-template-curly-in-string": "warn",
			"no-throw-literal": "warn",
			"no-undef-init": "warn",
			"no-unmodified-loop-condition": "warn",
			"no-unneeded-ternary": "warn",
			"no-unreachable-loop": "warn",
			"no-unused-expressions": "warn",
			"no-useless-call": "warn",
			"no-useless-computed-key": "warn",
			"no-useless-concat": "warn",
			"no-useless-rename": "warn",
			"no-useless-return": "warn",
			"no-var": "warn",
			"no-void": "warn",
			"object-shorthand": "warn",
			"operator-assignment": "warn",
			"prefer-arrow-callback": "warn",
			"prefer-const": "warn",
			"prefer-exponentiation-operator": "warn",
			"prefer-numeric-literals": "warn",
			"prefer-regex-literals": "warn",
			"prefer-rest-params": "warn",
			"require-atomic-updates": "warn",
			"require-await": "warn",
			"sort-imports": ["warn", { allowSeparatedGroups: true }],
			"symbol-description": "warn",
			"unicode-bom": "warn",
			"vars-on-top": "warn",
			"yoda": ["warn", "never", { onlyEquality: true }],
		},
	},
	...pluginTs.configs.recommended,
	{
		name: "General:TypeScript",
		files: ["**/*.{ts,vue}"],
		rules: {
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/class-methods-use-this": ["warn", {
				ignoreOverrideMethods: true,
				ignoreClassesThatImplementAnInterface: "public-fields",
			}],
			"@typescript-eslint/no-empty-function": "warn",
			"@typescript-eslint/no-empty-object-type": ["warn", { allowInterfaces: "always" }],
			"@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
			"@typescript-eslint/no-invalid-this": "error",
			"@typescript-eslint/no-loop-func": "warn",
			"@typescript-eslint/no-magic-numbers": ["warn", {
				ignore: [-1, 0, 1, 2],
				ignoreArrayIndexes: true,
				ignoreDefaultValues: true,
				ignoreEnums: true,
				ignoreNumericLiteralTypes: true,
				ignoreReadonlyClassProperties: true,
			}],
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-shadow": "warn",
			"@typescript-eslint/no-this-alias": ["warn", {
				allowDestructuring: true,
				allowedNames: ["cursor"],
			}],
			"@typescript-eslint/no-unsafe-declaration-merging": "off",
			"@typescript-eslint/no-unused-expressions": "warn",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-useless-constructor": ["warn"],
			"@typescript-eslint/triple-slash-reference": "off",
			"no-empty-function": "off",
			"no-invalid-this": "off",
			"no-loop-func": "off",
			"no-shadow": "off",
			"no-undef": "off", // This is redundant as TypeScript catches things that are really undefined
		},
	},
	{
		name: "Local rules",
		plugins: {
			"local-rules": pluginLocal,
		},
		rules: {
			"local-rules/ascii-comments": "error",
			"local-rules/single-line-control-statement-spacing": "warn",
		},
	},

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
	// Import
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		name: "Plugin:import",
		...pluginImport.flatConfigs.typescript,
		files: ["src/**/*.vue", "**/*.ts", "eslint.config.mjs"],
		plugins: {
			import: pluginImport,
		},
		rules: {
			"@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
			"import/consistent-type-specifier-style": ["warn", "prefer-top-level"],
			"import/newline-after-import": "warn",
			"import/no-cycle": ["warn", { ignoreExternal: true }],
			"import/no-duplicates": "warn",
			"import/no-unresolved": "error",
			"import/order": ["warn", {
				"groups": [
					[
						"builtin",
						"external",
					],
					[
						"internal",
						"parent",
						"sibling",
						"index",
						"object",
					],
					"type",
				],
				"newlines-between": "always",
			}],
			"no-duplicate-imports": "off",
			"sort-imports": "off",
		},
		settings: {
			"import/resolver": {
				typescript: {
					noWarnOnMultipleProjects: true,
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
			},
		},
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Vue
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	...pluginVue.configs["flat/essential"].map(cfg => ({
		...cfg,
		files: ["**/*.vue"],
	})),
	{
		name: "General:vue",
		files: ["**/*.vue"],
		languageOptions: {
			parserOptions: {
				parser: pluginTs.parser,
				extraFileExtensions: [".vue"],
			},
		},
		rules: {
			"@stylistic/indent": "off", // see vue
			"@stylistic/max-len": "off", // see vue
			"vue/max-len": ["warn", {
				code: 200,
				ignoreComments: true,
				ignoreHTMLAttributeValues: true,
				ignoreStrings: true,
				tabWidth: 4,
			}],
			"vue/multi-word-component-names": "off",
			"vue/no-mutating-props": ["warn", { shallowOnly: true }],
			"vue/script-indent": ["warn", "tab", {
				baseIndent: 1,
				ignores: [],
				switchCase: 1,
			}],
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
		name: "Node CommonJS files",
		files: ["gulpfile.js", "gulp/**", "eslint-local-rules.js"],
		languageOptions: {
			globals: globals.node,
			sourceType: "commonjs",
		},
		rules: {
			"@typescript-eslint/no-require-imports": "off",
		},
	},
	{
		name: "Node ESModule files",
		files: ["test/mocha.env.mjs", "lib/**/*.mjs", "eslint.config.mjs"],
		languageOptions: {
			globals: globals.nodeBuiltin,
		},
	},
	{
		name: "ESLint",
		files: ["eslint.config.mjs"],
		rules: {
			"@typescript-eslint/no-magic-numbers": "off",
			"import/no-unresolved": "off",
			"max-lines": "off",
			"sort-keys": ["warn", "asc", { minKeys: 6 }],
		},
	},
	{
		name: "RSBuild",
		files: ["rsbuild.config.ts"],
		rules: {
			"max-lines-per-function": "off",
		},
	},
	{
		name: "Browser global",
		files: ["src/**"],
		languageOptions: {
			globals: globals.browser,
		},
	},
	{
		name: "General:HTML",
		files: ["**/*.{htm,html}"],
		plugins: {
			html: pluginHtml,
		},
		rules: {
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/no-this-alias": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"max-lines-per-function": "off",
			"no-invalid-this": "off",
			"no-undef": "off",
			"no-var": "off",
			"prefer-rest-params": "off",
			"vars-on-top": "off",
		},
	},
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
