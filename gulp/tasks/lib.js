const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");

const root = "node_modules/";

// The file extension must be specified here, otherwise the folder will also be included
const compare = [
	config.src.app + "/**/*.vue",
	config.src.app + "/**/*.scss",
	config.src.app + "/**/*.htm",
	config.src.donate + "/**/*.vue",
	config.src.donate + "/**/*.htm",
];

gulp.task("bootstrap", () => {
	const sass = require("sass");
	const gulpSass = require("gulp-sass");
	return gulp.src(config.src.lib + "/bootstrap/bootstrap.scss")
		.pipe(newer({
			dest: config.dest.temp + "/bootstrap.css",
			extra: [
				__filename,
				root + "bootstrap/package.json",
			],
		}))
		.pipe(gulpSass(sass)())
		.pipe($.purgecss({
			content: compare,
			safelist: {
				standard: [
					/backdrop/,
					/modal-static/,
				],
				variables: [
					"--bs-primary",
					/^--bs-btn-disabled/,
					/^--bs-nav-tabs/,
				],
			},
			variables: true,
		}))
		.pipe($.replace(/(\r|\n)*\/\*.+?\*\/$/, "")) // remove sourcemap
		.pipe(gulp.dest(config.dest.temp));
});
