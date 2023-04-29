const $ = require("../utils/proxy");
const gulp = require("gulp");

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

gulp.task("syncVersion", () => {
	const package = require("../../package.json");
	return gulp.src(config.src.public + "/index.htm")
		.pipe($.replace(
			/<meta name="version" content="[^"]+">/,
			`<meta name="version" content="${package.version}">`
		))
		.pipe(gulp.dest(config.src.public));
});

/** Bump version of HTML file */
gulp.task("version", () =>
	gulp.src(config.src.public + "/index.htm")
		.pipe($.replace(/app_version: "(\d+)"/, (a, b) => `app_version: "${Number(b) + 1}"`))
		.pipe(gulp.dest(config.src.public))
);

/** Main HTML task */
gulp.task("html", () => $.all(
	// Debug
	gulp.src(config.src.public + "/index.htm")
		.pipe(newer({
			dest: config.dest.debug + "/index.htm",
			extra: [__filename, config.src.app + "/**/*", "gulp/plugins/debug.js"],
		}))
		.pipe(debug())
		.pipe(ssg())
		.pipe(gulp.dest(config.dest.debug)),

	// Dist
	gulp.src(config.src.public + "/index.htm")
		.pipe(newer({
			dest: config.dest.dist + "/index.htm",
			extra: [__filename, config.src.app + "/**/*"],
		}))
		.pipe($.htmlMinifierTerser(htmlMinOption))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(ssg())
		.pipe(gulp.dest(config.dest.dist))
));
