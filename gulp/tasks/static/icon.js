const $ = require("../../utils/proxy");
const gulp = require("gulp");

const newer = require("../../utils/newer");
const config = require("../../config.json");
const woff2 = require("../../plugins/woff2");

/** Build BPS icon set */
module.exports = () =>
	gulp.src(config.src.public + "/assets/bps/**/*", {
		encoding: false, // Gulp v5
	})
		.pipe(newer({
			dest: config.dest.dist + "/assets/bps/style.css",
			extra: [__filename, "gulp/plugins/woff2.js"],
		}))
		.pipe(woff2("bps"))
		.pipe($.if(file => file.extname == ".css", $.cleanCss()))
		.pipe(gulp.dest(config.dest.dist + "/assets/bps"));
