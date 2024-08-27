const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");
const { purge, extra } = require("../utils/purge");

const root = "node_modules/";

gulp.task("bootstrap", () => {
	const sass = require("sass");
	const gulpSass = require("gulp-sass");
	const postcssPresetEnv = require("postcss-preset-env");
	let stream = gulp.src(config.src.lib + "/bootstrap/bootstrap.min.scss")
		.pipe(newer({
			dest: config.dest.temp + "/bootstrap.min.css",
			extra: [
				__filename,
				".browserslistrc",
				root + "bootstrap/package.json",
				...extra,
			],
		}))
		.pipe(gulpSass(sass)({
			outputStyle: "compressed",
		}));
	stream = purge(stream);
	return stream
		.pipe($.postcss([postcssPresetEnv()])) // will use browserslist config
		.pipe(gulp.dest(config.dest.temp));
});
