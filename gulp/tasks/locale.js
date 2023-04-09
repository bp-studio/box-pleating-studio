const concat = require("gulp-concat");
const gulp = require("gulp");
const terser = require("gulp-terser");
const through2 = require("gulp-through2");
const wrap = require("@makeomatic/gulp-wrap-js");

const newer = require("../utils/newer");
const config = require("../config.json");
const order = require("../plugins/order");

function compile(t) {
	if(t.includes("{")) {
		t = t.replace(/\{(\d+)\}/g, "',i(l($1)),'");
		return "({normalize:n,interpolate:i,list:l})=>n(['" + t + "'])";
	}
	return `_=>'${t}'`;
}

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
		.pipe(through2(content => content.replace(/'((?:[^'\\]|\\.)+)'(.)/gs, ($0, $1, $2) => {
			if($2 == "]" || $2 == ":") return $0;
			return compile($1) + $2;
		})))
		.pipe(terser())
		.pipe(gulp.dest(config.dest.dist))
);
