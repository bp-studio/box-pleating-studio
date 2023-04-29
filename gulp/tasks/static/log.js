const $ = require("../../utils/proxy");
const gulp = require("gulp");

const newer = require("../../utils/newer");
const config = require("../../config.json");
const log = require("../../plugins/log");
const htmlMinOption = require("../../html.json");

const libs = [
	"font-awesome/css/all.min.css",
	"bootstrap/bootstrap.min.js",
];

/** Build update logs */
module.exports = () =>
	gulp.src([
		config.src.log + "/*.md",
		"!**/README.md",
	])
		.pipe(newer({
			dest: config.dest.dist + "/log/log.js",
			extra: [__filename, "gulp/plugins/log.js"],
		}))
		.pipe(log("log.js", libs))
		.pipe($.if(file => file.extname == ".js", $.terser(), $.htmlMinifierTerser(htmlMinOption)))
		.pipe(gulp.dest(config.dest.dist + "/log"));
