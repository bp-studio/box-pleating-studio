const all = require("gulp-all");
const gulp = require("gulp");
const htmlMin = require("gulp-html-minifier-terser");
const replace = require("gulp-replace");

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

/** Bump version of HTML file */
gulp.task("version", () =>
	gulp.src(config.src.public + "/index.htm")
		.pipe(replace(/app_version: "(\d+)"/, (a, b) => `app_version: "${Number(b) + 1}"`))
		.pipe(gulp.dest(config.src.public))
);

/** Main HTML task */
gulp.task("html", () => all(
	// 偵錯版
	gulp.src(config.src.public + "/index.htm")
		.pipe(newer({
			dest: config.dest.debug + "/index.htm",
			extra: [__filename, config.src.app + "/**/*", "gulp/plugins/debug.js"],
		}))
		.pipe(debug())
		.pipe(ssg())
		.pipe(gulp.dest(config.dest.debug)),

	// 正式版
	gulp.src(config.src.public + "/index.htm")
		.pipe(newer({
			dest: config.dest.dist + "/index.htm",
			extra: [__filename, config.src.app + "/**/*"],
		}))
		.pipe(htmlMin(htmlMinOption))
		// 避免 VS Code Linter 出錯
		.pipe(replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(ssg())
		.pipe(gulp.dest(config.dest.dist))
));
