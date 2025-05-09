import { FlatCompat } from "@eslint/eslintrc";
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

export default [
	{
		name: "Global ignores",
		ignores: ["{build,coverage}/**", "lib/**/*.js", "lib/optimizer/**/*.mjs", "src/app/gen/**"],
	},
	{
		name: "Matching file extensions",
		files: ["**/*.{ts,vue,htm}"],
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// General rules
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	pluginJs.configs.recommended,
	...pluginTs.configs.recommended,
	...stylistic,
	{
		name: "General:TypeScript",
		files: ["**/*.{ts,vue}"],
		rules: {
			"@typescript-eslint/class-methods-use-this": ["warn", {
				ignoreOverrideMethods: true,
				ignoreClassesThatImplementAnInterface: "public-fields",
			}],
			"@typescript-eslint/no-empty-function": "warn",
			"@typescript-eslint/no-empty-object-type": ["warn", { allowInterfaces: "always" }],
			"@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
			"@typescript-eslint/no-invalid-this": "error",
			"@typescript-eslint/no-loop-func": ["warn"],
			"@typescript-eslint/no-magic-numbers": ["warn", {
				ignore: [-1, 0, 1, 2],
				ignoreArrayIndexes: true,
				ignoreDefaultValues: true,
				ignoreEnums: true,
				ignoreNumericLiteralTypes: true,
				ignoreReadonlyClassProperties: true,
			}],
			"@typescript-eslint/no-shadow": "warn",
			"@typescript-eslint/no-this-alias": ["warn", {
				allowDestructuring: true,
				allowedNames: ["cursor"],
			}],
			"@typescript-eslint/no-unsafe-declaration-merging": "off",
			"@typescript-eslint/no-unused-expressions": "warn",
			"@typescript-eslint/no-useless-constructor": ["warn"],
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
	{
		name: "General rules",
		rules: {
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/ban-types": "off",
			"@typescript-eslint/no-empty-interface": "off",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/triple-slash-reference": "off",
			"accessor-pairs": "off",
			"array-callback-return": "warn",
			"arrow-body-style": "warn",
			"block-scoped-var": "warn",
			"camelcase": "off",
			"capitalized-comments": "off",
			"class-methods-use-this": "off",
			"complexity": "warn",
			"consistent-return": "off",
			"consistent-this": "off",
			"curly": ["warn", "multi-line", "consistent"],
			"default-case": "warn",
			"default-case-last": "warn",
			"default-param-last": "warn",
			"dot-notation": "warn",
			"eqeqeq": "off",
			"func-name-matching": "warn",
			"func-names": "off",
			"func-style": "off",
			"grouped-accessor-pairs": "warn",
			"guard-for-in": "off",
			"id-denylist": "warn",
			"id-length": "off",
			"id-match": "warn",
			"init-declarations": "off",
			"line-comment-position": "off",
			"max-classes-per-file": "warn",
			"max-depth": "warn",
			"max-lines": ["warn", { skipBlankLines: true, skipComments: true }],
			"max-lines-per-function": ["warn", { skipComments: true }],
			"max-nested-callbacks": "warn",
			"max-params": ["warn", 6],
			"max-statements": "off",
			"multiline-comment-style": "off",
			"new-cap": "warn",
			"no-alert": "warn",
			"no-array-constructor": "warn",
			"no-await-in-loop": "warn",
			"no-bitwise": "off",
			"no-caller": "warn",
			"no-cond-assign": "off",
			"no-console": "off",
			"no-constant-binary-expression": "off",
			"no-constant-condition": ["warn", { checkLoops: false }],
			"no-constructor-return": "warn",
			"no-continue": "off",
			"no-debugger": "off",
			"no-div-regex": "warn",
			"no-duplicate-imports": "warn",
			"no-else-return": "off",
			"no-empty": ["warn", { allowEmptyCatch: true }],
			"no-empty-function": "off",
			"no-eq-null": "off",
			"no-eval": "warn",
			"no-extend-native": "warn",
			"no-extra-bind": "warn",
			"no-extra-label": "warn",
			"no-implicit-coercion": "warn",
			"no-implied-eval": "warn",
			"no-inline-comments": "off",
			"no-inner-declarations": "off",
			"no-invalid-this": "off",
			"no-irregular-whitespace": "error",
			"no-iterator": "warn",
			"no-label-var": "warn",
			"no-labels": "error",
			"no-lone-blocks": "warn",
			"no-lonely-if": "off",
			"no-loop-func": "off",
			"no-loss-of-precision": "off",
			"no-magic-numbers": "off",
			"no-multi-assign": "off",
			"no-multi-str": "error",
			"no-negated-condition": "off",
			"no-nested-ternary": "warn",
			"no-new": "off",
			"no-new-func": "warn",
			"no-new-object": "warn",
			"no-new-wrappers": "warn",
			"no-nonoctal-decimal-escape": "warn",
			"no-octal-escape": "warn",
			"no-param-reassign": "off",
			"no-plusplus": "off",
			"no-promise-executor-return": "off",
			"no-proto": "warn",
			"no-restricted-exports": "warn",
			"no-restricted-globals": "warn",
			"no-restricted-imports": "warn",
			"no-restricted-properties": "warn",
			"no-restricted-syntax": "warn",
			"no-return-assign": "off",
			"no-return-await": "off",
			"no-script-url": "warn",
			"no-self-compare": "warn",
			"no-sequences": "warn",
			"no-shadow": "off",
			"no-template-curly-in-string": "warn",
			"no-ternary": "off",
			"no-this-before-super": "error",
			"no-throw-literal": "warn",
			"no-undef-init": "warn",
			"no-undefined": "off",
			"no-underscore-dangle": "off",
			"no-unexpected-multiline": "error",
			"no-unmodified-loop-condition": "warn",
			"no-unneeded-ternary": "warn",
			"no-unreachable-loop": "warn",
			"no-unsafe-optional-chaining": "warn",
			"no-unused-expressions": "off",
			"no-use-before-define": "off",
			"no-useless-backreference": "warn",
			"no-useless-call": "warn",
			"no-useless-computed-key": "warn",
			"no-useless-concat": "warn",
			"no-useless-constructor": "off",
			"no-useless-rename": "warn",
			"no-useless-return": "warn",
			"no-var": "warn",
			"no-void": "warn",
			"no-warning-comments": "off",
			"no-with": "error",
			"object-shorthand": "warn",
			"one-var": "off",
			"one-var-declaration-per-line": "off",
			"operator-assignment": "warn",
			"prefer-arrow-callback": "warn",
			"prefer-const": "warn",
			"prefer-destructuring": "off",
			"prefer-exponentiation-operator": "warn",
			"prefer-named-capture-group": "off",
			"prefer-numeric-literals": "warn",
			"prefer-object-spread": "off",
			"prefer-promise-reject-errors": "off",
			"prefer-regex-literals": "warn",
			"prefer-rest-params": "warn",
			"prefer-spread": "off",
			"prefer-template": "off",
			"radix": "off",
			"require-atomic-updates": "warn",
			"require-await": "warn",
			"require-unicode-regexp": "off",
			"sort-imports": ["warn", { allowSeparatedGroups: true }],
			"sort-keys": "off",
			"sort-vars": "off",
			"symbol-description": "warn",
			"unicode-bom": "warn",
			"vars-on-top": "warn",
			"yoda": ["warn", "never", { onlyEquality: true }],
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
			"no-mixed-spaces-and-tabs": "off", // to work with Volar formatter
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
		...pluginMocha.configs.flat.recommended,
		files: ["test/**"],
	},
	{
		files: ["test/**"],
		rules: {
			"mocha/prefer-arrow-callback": "warn",
			"mocha/no-exports": "off",
			"mocha/no-skipped-tests": "off",
		},
	},
	{
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Specific scopes
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		files: ["gulpfile.js", "gulp/**", "test/mocha.env.mjs", "eslint-local-rules.js", "lib/**/*.mjs"],
		languageOptions: {
			globals: globals.node,
			sourceType: "commonjs",
		},
		rules: {
			"@typescript-eslint/no-require-imports": "off",
		},
	},
	{
		files: ["eslint.config.mjs"],
		languageOptions: {
			globals: globals.nodeBuiltin,
		},
		rules: {
			"@typescript-eslint/no-magic-numbers": "off",
			"import/no-unresolved": "off",
			"max-lines": "off",
			"sort-keys": ["warn", "asc", { minKeys: 6 }],
		},
	},
	{
		files: ["rsbuild.config.ts"],
		rules: {
			"max-lines-per-function": "off",
		},
	},
	{
		files: ["src/**"],
		languageOptions: {
			globals: globals.browser,
		},
	},
	{
		files: ["src/**/*.{ts,vue}"],
		rules: {
			"@typescript-eslint/explicit-function-return-type": ["warn", {
				allowExpressions: true,
			}],
		},
	},
	{
		files: ["src/core/**"],
		rules: {
			// This rule is good for identifying unnecessary optional chaining,
			// but otherwise is giving too many warnings.
			// So we keep it off in most cases and turn it on as needed.
			"@typescript-eslint/no-unnecessary-condition": "off",
		},
	},
	{
		name: "General:HTML",
		files: ["**/*.htm"],
		plugins: {
			html: pluginHtml,
		},
		rules: {
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/no-this-alias": "off",
			"max-lines-per-function": "off",
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
];
