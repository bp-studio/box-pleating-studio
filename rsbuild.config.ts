import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";
import { InjectManifest } from "@aaroon/workbox-rspack-plugin";
import { pluginSass } from "@rsbuild/plugin-sass";

const isProduction = process.env.NODE_ENV === "production";
const inspectBuild = false;

export default defineConfig({
	dev: {
		progressBar: true,
	},
	source: {
		entry: {
			index: "./src/app/main.ts",
			donate: "./src/other/donate/main.ts",
		},
		decorators: {
			version: "legacy",
		},
		define: {
			// __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
			DEBUG_ENABLED: !isProduction,
			TEST_MODE: false,
		},
		tsconfigPath: "./src/app/tsconfig.json",
	},
	html: {
		template: ({ entryName }) => `./build/temp/${entryName}.htm`,
	},
	server: {
		port: 30783,
		publicDir: {
			name: "src/public",
			copyOnBuild: true,
		},
		historyApiFallback: {
			index: "/index.htm",
			rewrites: [{ from: /^\/donate/, to: "/donate.htm" }],
		},
	},
	performance: !isProduction ? undefined : {
		chunkSplit: {
			strategy: "custom",
			splitChunks: {
				cacheGroups: {
					locale: {
						test: /locale/,
						name: "locale",
						chunks: "initial",
					},
					pixiCore: {
						test: /@pixi[\\/]core|earcut/,
						name: "pixi-core",
						chunks: "async",
						priority: 2,
					},
					pixi: {
						test: /@pixi/,
						name: "pixi",
						chunks: "async",
						priority: 1,
					},
					bootstrap: {
						test: /bootstrap|popper/,
						name: "bootstrap",
						chunks: "async",
					},
					jszip: {
						test: /jszip/,
						name: "jszip-core",
						chunks: "async",
					},
					vue: {
						test: /@vue[\\/]/,
						name: "vue",
						chunks: "initial",
					},
					vendor: {
						test: /node_modules/,
						name: "vendor",
						chunks: "initial",
						priority: -1,
					},
				},
			},
		},
		preload: {
			type: "all-chunks",
			include: [/fa-.+\.woff2$/, /locale\.\w+\.js/],
		},
	},
	output: {
		cleanDistPath: isProduction,
		filename: {
			html: "[name].htm", // For historical reason
		},
		copy: [
			{ from: "src/public/manifest.json", to: "." },
			// Only precache the two most common resolution; see https://tinyurl.com/7rxv5f97
			{ from: "src/public/assets/icon/icon-32.png", to: "assets/icon" },
			{ from: "src/public/assets/icon/icon-192.png", to: "assets/icon" },
			{ from: "*.md", to: "log", context: "build/temp/log" },
		],
		dataUriLimit: 100,
		legalComments: inspectBuild ? "inline" : "none",
		polyfill: "off",
		minify: !inspectBuild && {
			jsOptions: {
				minimizerOptions: {
					format: {
						asciiOnly: false, // do not escape unicode in strings
					},
				},
			},
		},
		distPath: {
			root: "build/dist",
		},
	},
	plugins: [
		pluginSass({
			sassLoaderOptions: {
				sassOptions: {
					silenceDeprecations: ["mixed-decls"],
				},
			},
		}),
		pluginVue(),
	],
	tools: {
		rspack: (config, { appendPlugins, isDev }) => {
			const rule = config.module?.rules[2];
			if(rule && typeof rule == "object" && Array.isArray(rule.use)) {
				rule.use.push({
					loader: "ifdef-loader",
					options: {
						DEBUG: isDev,
					},
				});
			}

			const workboxPlugin = new InjectManifest({
				swSrc: "./src/other/service/sw.ts",
				exclude: [/\.(svg|ttf|woff)$/],
				manifestTransforms: [
					/** Only the last log will be included in precache */
					manifest => {
						let high = 0;
						for(const entry of manifest) {
							const m = entry.url.match(/(\d+)\.md$/);
							if(!m) continue;
							const n = Number(m[1]);
							if(n > high) high = n;
						}
						const reg = new RegExp(`(?<!${high})\\.md$`);
						manifest = manifest.filter(e => !e.url.match(reg));
						return { manifest };
					},
				],
			});
			if(isDev) {
				// Silence Workbox build warning with HMR
				// https://github.com/GoogleChrome/workbox/issues/1790#issuecomment-1435032010
				Object.defineProperty(workboxPlugin, "alreadyCalled", {
					get() { return false; },
					set() { /* do nothing */ },
				});
			}
			appendPlugins(workboxPlugin);
		},
	},
});
