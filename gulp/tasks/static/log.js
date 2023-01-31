const gulp = require("gulp");
const gulpIf = require("gulp-if");
const htmlMin = require("gulp-html-minifier-terser");
const terser = require("gulp-terser");

const newer = require("../../utils/newer");
const config = require("../../config.json");
const log = require("../../plugins/log");
const htmlMinOption = require("../../html.json");

const libs = [
	"font-awesome/css/all.min.css",
	"bootstrap/bootstrap.min.js",
	"vuedraggable.min.js",
	"jszip.min.js",
	"lzma_worker-min.js",
];

/** 建置更新 log */
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
		.pipe(gulpIf(file => file.extname == ".js", terser(), htmlMin(htmlMinOption)))
		.pipe(gulp.dest(config.dest.dist + "/log"));
