const $ = require("../utils/proxy");
const gulp = require("gulp");
const fs = require("fs");

const newer = require("../utils/newer");
const { ssgI18n } = require("../utils/esbuild");
const config = require("../config.json");
const debug = require("../plugins/debug");
const htmlMinOption = require("../html.json");

function ssg() {
	// polyfill
	require("global-jsdom/register");
	globalThis.locale = [];
	globalThis.logs = [];
	globalThis.matchMedia = () => ({ matches: false });

	return ssgI18n({
		appRoot: config.src.app + "/vue/app.vue",
		messages: { en: require("../../" + config.src.locale + "/en.json") },
	});
}

const insertVersion = (package) => $.through2(
	content => content
		.replace("__VERSION__", package.version)
		.replace("__APP_VERSION__", package.app_version)
);

/** Add simple handling for IE < 10, where conditional comments were supported. */
const wrapIE = () => $.through2(c => `<!--[if IE]><body>IE is not supported.</body><![endif]--><!--[if !IE]><!-->${c}<!--<![endif]-->`);

/** Bump build version */
gulp.task("version", () =>
	gulp.src("package.json")
		.pipe($.replace(/"app_version": "(\d+)"/, (a, b) => `"app_version": "${Number(b) + 1}"`))
		.pipe(gulp.dest("."))
);

/** Main HTML task */
gulp.task("html", () => {
	// We cannot directly use `require` here,
	// as that will likely get the outdated content.
	const package = JSON.parse(fs.readFileSync("package.json").toString("utf8"));
	return $.all(
		// Debug
		gulp.src(config.src.public + "/index.htm")
			.pipe(newer({
				dest: config.dest.debug + "/index.htm",
				extra: [__filename, "package.json", config.src.app + "/**/*", "gulp/plugins/debug.js"],
			}))
			.pipe(insertVersion(package))
			.pipe(debug())
			.pipe(ssg())
			.pipe(wrapIE())
			.pipe(gulp.dest(config.dest.debug)),

		// Dist
		gulp.src(config.src.public + "/index.htm")
			.pipe(newer({
				dest: config.dest.dist + "/index.htm",
				extra: [__filename, "package.json", config.src.app + "/**/*"],
			}))
			.pipe(insertVersion(package))
			.pipe($.htmlMinifierTerser(htmlMinOption))
			// Avoid VS Code Linter warnings
			.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
			.pipe(ssg())
			.pipe(wrapIE())
			.pipe(gulp.dest(config.dest.dist))
	);
});
