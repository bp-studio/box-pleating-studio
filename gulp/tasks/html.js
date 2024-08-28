const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const { ssgI18n } = require("../utils/esbuild");
const config = require("../config.json");
const htmlMinOption = require("../html.json");

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
