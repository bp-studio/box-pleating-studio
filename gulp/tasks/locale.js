const concat = require("gulp-concat");
const gulp = require("gulp");
const terser = require("gulp-terser");
const through2 = require("gulp-through2");
const wrap = require("@makeomatic/gulp-wrap-js");

const newer = require("../utils/newer");
const config = require("../config.json");
const order = require("../plugins/order");

gulp.task("locale", () =>
	gulp.src(config.src.locale + "/*.json")
		.pipe(newer({
			dest: config.dest.dist + "/locale.js",
			extra: [__filename, "../plugins/order.js"],
		}))
		.pipe(order("en.json"))
		.pipe(gulp.dest(config.src.locale))
		.pipe(through2((content, file) => `locale['${file.stem.toLowerCase()}']=` + content))
		.pipe(concat("locale.js"))
		.pipe(wrap("const locale={};%= body %"))
		.pipe(terser())
		.pipe(gulp.dest(config.dest.dist))
);
