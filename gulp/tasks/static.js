const $ = require("../utils/proxy");
const fs = require("fs");
const gulp = require("gulp");

const config = require("../config.json");
const newer = require("../utils/newer");
const log = require("../plugins/log");
const woff2 = require("../plugins/woff2");
const htmlMinOption = require("../html.json");

const buildLog = () =>
	gulp.src([
		config.src.log + "/*.md",
		"!**/README.md",
	])
		.pipe(newer({
			dest: config.src.app + "/gen/log.ts",
			extra: [__filename, "gulp/plugins/log.js"],
		}))
		.pipe(log("log.ts"))
		.pipe($.if(file => file.extname == ".md", $.htmlMinifierTerser(htmlMinOption)))
		.pipe(gulp.dest(file => file.extname == ".md" ? config.dest.temp + "/log" : config.src.app + "/gen"));

const buildIcon = () =>
	gulp.src(config.src.icon + "/bps/**/*", {
		encoding: false, // Gulp v5
	})
		.pipe(newer({
			dest: config.dest.temp + "/bps/style.css",
			extra: [__filename, "gulp/plugins/woff2.js"],
		}))
		.pipe(woff2("bps"))
		.pipe(gulp.dest(config.dest.temp + "/bps"));

/** FontAwesome */
const faTarget = config.dest.temp + "/font-awesome";
const fontAwesome = () =>
	gulp.src(config.src.app + "/vue/**/*.vue")
		.pipe($.fontawesome())
		.pipe(gulp.dest(faTarget));

gulp.task("log", buildLog);

gulp.task("static", () => {
	const tasks = [
		buildIcon(),
		buildLog(),
	];
	// Only the first time the FontAwesome build will be executed automatically.
	// In other cases we call the `fa` task manually to improve performance.
	if(!fs.existsSync(faTarget)) {
		tasks.push(fontAwesome());
	}
	return $.all(tasks);
});

/**
 * This is the task for rebuilding FontAwesome.
 * Needs to be called manually.
 *
 * Note: For unknown reason, it appears that in local environment,
 * restarting the browser is needed for the new font to take effect.
 */
gulp.task("fa", fontAwesome);
