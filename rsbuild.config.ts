///<reference path="./src/shared/frontend/imports.d.ts" />

import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginVueSSG } from "@mutsuntsai/rsbuild-plugin-vue-ssg";
import { pluginCheckSyntax } from "@rsbuild/plugin-check-syntax";
import { pluginAssetsRetry } from "@rsbuild/plugin-assets-retry";
import { InjectManifest } from "@aaroon/workbox-rspack-plugin";
import { pluginSass } from "@rsbuild/plugin-sass";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import postcssPresetEnv from "postcss-preset-env";
import { createDescendantRegExp, makeTest } from "@mutsuntsai/rsbuild-utils";
import { createI18n } from "vue-i18n";

import locale from "./src/locale/en.json";
import pkg from "./package.json";

import type { PostCSSPlugin, RsbuildPlugin } from "@rsbuild/core";

const isProduction = process.env.NODE_ENV === "production";

// To enable these, execute for example `pnpm build -- doctor inspect`.
const useRsdoctor = process.argv.includes("doctor");
const inspectBuild = process.argv.includes("inspect");

// Serve over HTTPS (and thus HTTP/2, as in production); see `pnpm preview:tls`.
const useTLS = process.argv.includes("tls");

// Build static assets once
if(!fs.existsSync("build/temp")) {
	spawnSync("gulp", ["static"], { stdio: "inherit", shell: true });
}

export default defineConfig({
	dev: {
		client: {
			overlay: false,
		},
		progressBar: true,
		lazyCompilation: false, // This causes too many reloads on DEV.
	},
	resolve: {
		alias: {
			// This is needed, otherwise umd will be used,
			// causing vue compiler to be bundled.
			"vue-slicksort$": "./node_modules/vue-slicksort/dist/vue-slicksort.esm.js",
		},
	},
	source: {
		include: [/pixi\.js/, /core-base/, /vue-i18n/],
		entry: {
			index: "./src/app/main.ts",
			donate: "./src/other/donate/main.ts",
		},
		define: {
			// __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
			__VUE_I18N_LEGACY_API__: false,
		},
		tsconfigPath: "./src/app/tsconfig.json",
	},
	html: {
		template: ({ entryName }) => ({
			index: "./src/app/html/index.htm",
			donate: "./src/other/donate/donate.htm",
		}[entryName]),
		templateParameters: {
			VERSION: pkg.version,
			APP_VERSION: pkg.app_version,
		},
	},
	server: {
		port: 30783,
		publicDir: {
			name: "src/public",
		},
		historyApiFallback: {
			index: "/index.htm",
			rewrites: [{ from: /^\/donate/, to: "/donate.htm" }],
		},
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
		https: useTLS ? getCertificate() : undefined,
	},
	performance: !isProduction ? undefined : {
		chunkSplit: {
			strategy: "custom",
			splitChunks: {
				cacheGroups: {
					vue: {
						test: createDescendantRegExp("vue"),
						name: "vue",
						chunks: "all",
					},
					index: {
						// Dependencies of the modules here must be included,
						// or they are duplicated into each async chunk that
						// app/init.ts imports, causing many sequential
						// requests during startup.
						test: makeTest(
							/src[\\/](app|log)\b/, /idb-keyval/, /probably-china/,
							/inapp-spy/, /vue-loader[\\/]dist[\\/]exportHelper/,
							/client[\\/]screen[\\/]warmup[\\/]index/
						),
						name: "index",
						chunks: "all",
					},
					shared: {
						// This contains the modules used both by the main
						// thread and the worker, so this must be in a
						// separate file.
						test: makeTest(/src[\\/]shared[\\/]/, /tslib/),
						name: "shared",
						chunks: "async",
						priority: -1,
					},
					pixi: {
						// Pixi imports renderer-specific modules dynamically,
						// so we only take the ones that the client imports
						// statically, and leave the others in separate chunks
						// to load only the needed ones.
						test: makeTest(
							createDescendantRegExp("pixi.js"),
							// The warm-up stages
							/client[\\/]screen[\\/]warmup[\\/](?!index|client)/
						),
						name: "pixi",
						chunks: chunk => chunk.name == "client" ||
							Boolean(chunk.name?.startsWith("warmup-")),
						priority: -1,
					},
					i18n: {
						// Other locales are loaded on demand.
						test: makeTest(
							createDescendantRegExp("vue-i18n"), /locale\.ts$/,
							/locale[\\/]en\.json$/
						),
						name: "vue-i18n",
						chunks: "all",
						priority: 1,
					},
					vendor: {
						test: createDescendantRegExp("vue-slicksort", "bootstrap"),
						name: "vendor",
						chunks: "async",
						priority: 1,
					},
				},
			},
		},
		preload: {
			type: "all-chunks",
			include: [
				/\.css$/,
				/bps\.\w+\.woff2$/,
				/(vue(-\w+)?)\.\w+\.js/,
				// The client chunk is loaded with Pixi; see warmupPixi()
				/shared\.\w+\.js/,
			],
		},
		buildCache: true,
	},
	output: {
		cleanDistPath: isProduction,
		filename: {
			html: "[name].htm", // For historical reason
		},
		copy: [ // Copied files will be precached by the Service Worker.
			{ from: "src/public/manifest.json", to: "." },
			// Only precache the two most common resolution; see https://tinyurl.com/7rxv5f97
			{ from: "src/public/assets/icon/icon-32.png", to: "assets/icon" },
			{ from: "src/public/assets/icon/icon-192.png", to: "assets/icon" },
		],
		dataUriLimit: 100,
		legalComments: inspectBuild ? "inline" : "none",
		polyfill: "off",
		// sourceMap: { js: "source-map" },
		minify: !inspectBuild,
		distPath: {
			root: "build/dist",
		},
	},
	plugins: [
		pluginVue(),
		pluginVueSSG({
			entry: {
				index: "./src/app/vue/app.vue",
				donate: "./src/other/donate/app.vue",
			},
			externals: [
				"fflate",
				/^client\//,
				"@/toolbar/toolbar.vue",
				"@/panel/panel.vue",
				"@/status.vue",
				"@/gadgets/dpad.vue",
				"@/modals/modalFragment.vue",
				"@/dialogs/dialogFragment.vue",
			],
			appFactory: app => app.use(i18n),
			postProcess: (html: string, entryName: string) => entryName == "index" ? wrapIE(html) : html,
			jsdom(global) {
				global.matchMedia = () => ({ matches: false });
				global.__VUE_PROD_DEVTOOLS__ = false; // Used in vue-i18n
				global.i18n = i18n.global;
			},
		}),
		pluginSass({
			sassLoaderOptions: {
				sassOptions: {
					silenceDeprecations: [
						"color-functions",
						"import",
						"global-builtin",
						"if-function",
					],
				},
			},
		}),
		pluginCheckSyntax({
			ecmaVersion: 2019,
			excludeOutput: /optimizer/,
		}),
		pluginPreloadLocale(),
		pluginAssetsRetry({
			addQuery: true,
			max: 2,
			minify: true,
			test: url => !url.includes("gtag"),
			onFail: ({ url }) => typeof (errMgr) !== "undefined" && errMgr.setResErr(url),
		}),
	],
	tools: {
		bundlerChain: (chain, { CHAIN_ID }) => {
			chain.module.rule(CHAIN_ID.RULE.JS)
				.oneOf(CHAIN_ID.ONE_OF.JS_MAIN)
				.use("ifdef")
				.after(CHAIN_ID.USE.SWC)
				.loader("ifdef-loader")
				.options({
					DEBUG: !isProduction,
				});
			// The oneOf rule of plugin-sass is named "sass" (no constant in
			// CHAIN_ID). Using a non-existing name here silently creates an
			// empty rule that never matches, and PurgeCSS doesn't run.
			chain.module.rule(CHAIN_ID.RULE.SASS)
				.oneOf("sass")
				.use("bootstrap-loader")
				.after(CHAIN_ID.USE.CSS)
				.loader("./lib/bootstrap/loader.js");
		},
		postcss: (_, { addPlugins }) => {
			/**
			 * For the moment, although LightingCSS claims to handle vendor
			 * prefixes, the functionality seems less complete than
			 * postcssPresetEnv. For example, `-webkit-text-decoration` is not
			 * handled by LightingCSS (see https://caniuse.com/text-decoration).
			 */
			addPlugins(postcssPresetEnv() as PostCSSPlugin);
		},
		rspack: (_, { addRules, appendPlugins, isDev }) => {
			addRules({
				test: /\.md$/,
				use: [
					"./lib/html-minifier.js",
					{
						loader: "markdown-loader",
						options: {
							headerIds: false,
							mangle: false,
						},
					},
				],
				type: "asset/resource",
				generator: {
					filename: "log/[name][ext]",
				},
			});
			addRules({
				test: /\.json$/,
				use: "./lib/locale.js",
				type: "javascript/auto",
			});

			if(isDev) return;

			if(useRsdoctor) {
				appendPlugins(new RsdoctorRspackPlugin({
					linter: {
						rules: { "ecma-version-check": "off" },
					},
					supports: {
						generateTileGraph: true,
					},
					port: 6060,
				}));
			}

			appendPlugins(new InjectManifest({
				swSrc: "./src/other/service/sw.ts",
				exclude: [/\.ttf$/],
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
			}));
		},
	},
});

/**
 * The locales other than English are loaded on demand (see app/shared/locale),
 * but for the users of those locales, the locale chunk is needed right after
 * LCP. To avoid waiting for it, this injects an inline script that preloads
 * the chunks of the candidate locales (the same logic as `getLanguages()`)
 * in parallel with the entry chunk.
 */
function pluginPreloadLocale(): RsbuildPlugin {
	return {
		name: "preload-locale",
		setup(api) {
			api.modifyHTMLTags((tags, context) => {
				const { compilation, assetPrefix, filename } = context;
				if(filename != "index.htm") return tags;
				const urls: Record<string, string | null> = { en: null };
				for(const chunk of compilation.chunks) {
					const m = chunk.name?.match(/^locale-(.+)$/);
					const file = [...chunk.files].find(f => f.endsWith(".js"));
					if(m && file) urls[m[1]] = assetPrefix + file;
				}
				const script = `(function(u){
					var s = localStorage.getItem("locale"), n = navigator.languages || [], c = s ? [s] : [];
					for(var i = 0; i < n.length; i++) {
						var a = n[i].replace(/_/g, "-").toLowerCase()
							.replace(/^zh(-\\w+)?-hant.*$/, "zh-tw").replace(/^zh(-\\w+)?-hans.*$/, "zh-cn");
						for(var l in u) if(a.indexOf(l) == 0) { c.push(l); break; }
					}
					for(i = 0; i < c.length; i++) {
						if(!u[c[i]]) continue;
						var e = document.createElement("link");
						e.rel = "preload"; e.as = "script"; e.href = u[c[i]];
						document.head.appendChild(e);
						u[c[i]] = null;
					}
				})(${JSON.stringify(urls)});`;
				tags.headTags.unshift({ tag: "script", children: script });
				return tags;
			});
		},
	};
}

/**
 * Creates a locally-trusted certificate using mkcert (once).
 * Browsers only support HTTP/2 over TLS, and the certificate must be trusted
 * for the service worker to register.
 */
function getCertificate(): { key: Buffer, cert: Buffer } {
	const dir = "build/cert";
	const key = `${dir}/localhost-key.pem`;
	const cert = `${dir}/localhost.pem`;
	if(!fs.existsSync(key) || !fs.existsSync(cert)) {
		fs.mkdirSync(dir, { recursive: true });
		const result = spawnSync(
			"mkcert",
			["-key-file", key, "-cert-file", cert, "localhost", "127.0.0.1", "::1"],
			{ stdio: "inherit", shell: true }
		);
		if(result.status !== 0) {
			throw new Error("Failed to create the certificate with mkcert. " +
				"Please make sure that it is installed and can write to " + dir);
		}
	}
	return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

/**
 * Add simple handling for IE < 10,
 * where conditional comments were supported.
 */
const wrapIE = (c: string) => `<!--[if IE]><body>IE is not supported.</body><![endif]--><!--[if !IE]><!-->${c}<!--<![endif]-->`;

const i18n = createI18n<false, object>({
	locale: "en",
	legacy: false,
	messages: { en: locale },
});
