const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");
const htmlMinOption = require("../html.json");

function esVueOption(options) {
	return {
		templateOptions: {
			compilerOptions: {
				comments: false, // Remove HTML comments
				directiveTransforms: options?.directiveTransforms,
			},
		},
	};
}

// Setting ECMAScript building target
const target = ["es2018", "chrome66", "edge79", "firefox78", "opera53", "safari11.1", "ios11.3"];

function ssgOption(options) {
	const vt = require("@intlify/vue-i18n-extensions").transformVTDirective;
	const esVue = require("@mutsuntsai/esbuild-plugin-vue");
	const VueI18n = require("vue-i18n");
	const i18n = VueI18n.createI18n({
		locale: "en",
		messages: options.messages,
	});
	globalThis.i18n = i18n.global;
	globalThis.Worker = class { };
	return {
		appRoot: options.appRoot,
		appOptions: app => {
			// Avoiding data pollution between builds
			globalThis.localStorage?.clear();
			app.use(i18n);
		},
		esbuildOptions: {
			plugins: [
				esVue(esVueOption({
					directiveTransforms: { t: vt(i18n) }, // So that v-t directives will be processed
				})),
			],
			external: ["vue", "@vue", "vue-*", "@pixi", "bootstrap", "@popperjs", "fflate", "./src/client"],
			logLevel: "error", // silence warnings
			target,
		},
	};
}

function ssgI18n(options) {
	return $.vueSsg(ssgOption(options));
}

function ssg() {
	// polyfill
	require("global-jsdom/register");
	globalThis.matchMedia = () => ({ matches: false });

	return ssgI18n({
		appRoot: config.src.app + "/vue/app.vue",
		messages: { en: require("../../" + config.src.locale + "/en.json") },
	});
}

/** Add simple handling for IE < 10, where conditional comments were supported. */
const wrapIE = () => $.through2(c => `<!--[if IE]><body>IE is not supported.</body><![endif]--><!--[if !IE]><!-->${c}<!--<![endif]-->`);

/** Bump build version */
gulp.task("version", () =>
	gulp.src("package.json")
		.pipe($.replace(/"app_version": "(\d+)"/, (a, b) => `"app_version": "${Number(b) + 1}"`))
		.pipe(gulp.dest("."))
);

/** Main HTML task */
gulp.task("html", () => gulp.src(config.src.app + "/html/index.htm")
	.pipe(newer({
		dest: config.dest.temp + "/index.htm",
		extra: [__filename, "package.json", config.src.app + "/**/*"],
	}))
	.pipe($.htmlMinifierTerser(htmlMinOption))
	// Avoid VS Code Linter warnings
	.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
	.pipe(ssg())
	.pipe(wrapIE())
	.pipe(gulp.dest(config.dest.temp)));

gulp.task("donate", () =>
	gulp.src(config.src.donate + "/donate.htm")
		.pipe(newer({
			dest: config.dest.temp + "/donate.htm",
			extra: [__filename],
		}))
		.pipe($.htmlMinifierTerser(htmlMinOption))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(ssgI18n({
			appRoot: config.src.donate + "/app.vue",
			messages: { en: require("../../" + config.src.locale + "/en.json") },
		}))
		.pipe(gulp.dest(config.dest.temp))
);
