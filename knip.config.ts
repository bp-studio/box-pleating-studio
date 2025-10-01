import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: [
		"src/app/init.ts",
		"src/client/main.ts",
		"src/client/plugins/optimizer/worker.ts",
		"src/core/main.ts",
		"src/other/service/sw.ts",
		"gulpfile.js",
		"lib/bootstrap/loader.js",
	],
	project: ["src/**", "gulp/**", "test/**"],
	paths: {
		"@/*": ["src/app/vue/*"],
		"@utils/*": ["test/utils/*"],
		"app/*": ["src/app/*"],
		"client/*": ["src/client/*"],
		"core/*": ["src/core/*"],
		"lib/*": ["lib/*"],
		"locale/*": ["src/locale/*"],
		"shared/*": ["src/shared/*"],
		"temp/*": ["build/temp/*"],
	},
	tags: [
		"-knipIgnore",
	],
	ignore: [
		"src/**/*.d.ts",
		"src/shared/data/**", // Some unused implementations are left for reference
	],
	ignoreBinaries: ["echo."],
	ignoreDependencies: [
		"@(pixi|popperjs|rspack|types)/.+",
		".+-loader",
		"nyc",
		"eslint-plugin-typescript-compat",
		"@swc-node/core", // used in mocha test
		"@swc/core", // peer of @swc-node/core
		"@fortawesome/fontawesome-free",
	],
	typescript: {
		config: [
			"src/app/tsconfig.json",
			"src/core/tsconfig.json",
			"src/shared/tsconfig.json",
		],
	},
};

export default config;
