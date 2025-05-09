const gulp = require("gulp");
const htmlMinifierTerser = require("gulp-html-minifier-terser");
const through2 = require("gulp-through2");
const vueSsg = require("gulp-vue-ssg");

const newer = require("../utils/newer");
const config = require("../config.json");

const htmlMinOption = {
	collapseWhitespace: true,
	removeComments: true,
	minifyJS: {
		ie8: true,
	},
};

// Setting ECMAScript building target
const target = ["es2018", "chrome66", "edge79", "firefox78", "opera53", "safari11.1", "ios11.3"];

function ssgOption(options) {
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
				esVue({
					templateOptions: {
						compilerOptions: {
							comments: false, // Remove HTML comments
						},
					},
				}),
			],
			external: [
				// Mark async dependencies as external to reduce compile time
				"vue", "@vue", "vue-*", "@pixi", "bootstrap", "@popperjs", "fflate",
				"./src/client/*",
				"./src/app/vue/toolbar/toolbar.vue",
				"./src/app/vue/panel/panel.vue",
				"./src/app/vue/status.vue",
				"./src/app/vue/gadgets/dpad.vue",
				"./src/app/vue/modals/modalFragment.vue",
				"./src/app/vue/dialogs/dialogFragment.vue",
			],
			logLevel: "error", // silence warnings
			target,
		},
	};
}

function ssgI18n(options) {
	return vueSsg(ssgOption(options));
}

function ssg() {
	// polyfill
	require("global-jsdom/register");
	globalThis.matchMedia = () => ({ matches: false });
	globalThis.performance.navigation = {};

	return ssgI18n({
		appRoot: config.src.app + "/vue/app.vue",
		messages: { en: require("../../" + config.src.locale + "/en.json") },
	});
}

/** Avoid VS Code Linter warnings */
const patchScript = () => through2(c => c.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"));

/** Add simple handling for IE < 10, where conditional comments were supported. */
const wrapIE = () => through2(c => `<!--[if IE]><body>IE is not supported.</body><![endif]--><!--[if !IE]><!-->${c}<!--<![endif]-->`);

/** Bump build version */
gulp.task("version", () =>
	gulp.src("package.json")
		.pipe(through2(c => c.replace(/"app_version": "(\d+)"/, (a, b) => `"app_version": "${Number(b) + 1}"`)))
		.pipe(gulp.dest("."))
);

/** Main HTML task */
gulp.task("html", () => gulp.src(config.src.app + "/html/index.htm")
	.pipe(newer({
		dest: config.dest.temp + "/index.htm",
		extra: [__filename, config.src.app + "/**/*"],
	}))
	.pipe(htmlMinifierTerser(htmlMinOption))
	.pipe(patchScript())
	.pipe(ssg())
	.pipe(wrapIE())
	.pipe(gulp.dest(config.dest.temp)));

/** Donate page */
gulp.task("donate", () =>
	gulp.src(config.src.donate + "/donate.htm")
		.pipe(newer({
			dest: config.dest.temp + "/donate.htm",
			extra: [__filename],
		}))
		.pipe(htmlMinifierTerser(htmlMinOption))
		.pipe(patchScript())
		.pipe(ssgI18n({
			appRoot: config.src.donate + "/app.vue",
			messages: { en: require("../../" + config.src.locale + "/en.json") },
		}))
		.pipe(gulp.dest(config.dest.temp))
);
