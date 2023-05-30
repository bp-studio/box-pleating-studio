const $ = require("../utils/proxy");
const fs = require("fs");
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");

const buildLog = require("./static/log");
const buildIcon = require("./static/icon");

const libDest = config.dest.dist + "/lib";

/** If a given js file has a `min` or `prod` version */
function hasMin(file) {
	return fs.existsSync(file.path.replace(/js$/, "min.js")) || fs.existsSync(file.path.replace(/js$/, "prod.js"));
}

/** Copying debug assets */
const copyDebugStatic = () => gulp.src([
	"*.js",
	"*.js.map",
], { cwd: config.src.lib })
	.pipe($.filter(file => {
		// include those .js files with a `min` version
		if(file.extname != ".js") return true;
		return hasMin(file);
	}))
	.pipe(newer(config.dest.debug + "/lib")) // Use 1:1 comparison
	.pipe(gulp.dest(config.dest.debug + "/lib"));

/** Copying static assets */
const copyStatic = () => gulp.src([
	"**/*",

	// We need to make specific about the filenames starting with "."
	".htaccess",
	".well-known/**/*",

	// These will not be included
	"!**/README.md",

	// These files will be built separately, so we don't treat them as static assets.
	"!index.htm",
	"!log/*",
	"!assets/bps/**/*",
], { cwd: config.src.public, base: config.src.public })
	.pipe(newer(config.dest.dist)) // Use 1:1 comparison
	.pipe($.if(file => file.extname == ".js", $.terser({
		compress: {
			drop_debugger: false,
		},
	})))
	.pipe(gulp.dest(config.dest.dist));

/** FontAwesome */
const faTarget = libDest + "/font-awesome";
const fontAwesome = () =>
	gulp.src(config.src.app + "/vue/**/*.vue")
		.pipe($.fontawesome())
		.pipe(gulp.dest(libDest + "/font-awesome"));

gulp.task("log", () => buildLog());

gulp.task("static", () => {
	const tasks = [
		buildIcon(),
		buildLog(),
		copyDebugStatic(),
		copyStatic(),
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
