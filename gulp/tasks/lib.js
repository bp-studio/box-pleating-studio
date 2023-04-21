const all = require("gulp-all");
const esbuild = require("gulp-esbuild");
const gulp = require("gulp");
const gulpSass = require("gulp-sass");
const postcss = require("gulp-postcss");
const postcssPresetEnv = require("postcss-preset-env");
const sass = require("sass");

const newer = require("../utils/newer");
const config = require("../config.json");
const { purge, extra } = require("../utils/purge");
const { pixiCore, pixi } = require("./pixi");

const root = "node_modules/";

function quickCopy(path, debug, ...additionalSteps) {
	const target = debug ? config.dest.debug : config.dest.dist;
	let result = gulp.src(root + path)
		.pipe(newer({
			dest: target + "/lib",
			extra: __filename,
		}));
	for(const step of additionalSteps) result = result.pipe(step);
	return result.pipe(gulp.dest(target + "/lib"));
}

const bootstrapJS = () => gulp.src(config.src.lib + "/bootstrap/bootstrap.ts")
	.pipe(newer({
		dest: config.dest.dist + "/lib/bootstrap/bootstrap.min.js",
		extra: [__filename, root + "bootstrap/package.json"],
	}))
	.pipe(esbuild({
		bundle: true,
		globalName: "Bootstrap",
		legalComments: "none",
		outfile: "bootstrap.min.js",
		minify: true,
		target: "es2016", // for maximal compatibility
	}))
	.pipe(gulp.dest(config.dest.dist + "/lib/bootstrap"));

const bootstrapCSS = () => {
	let stream = gulp.src(config.src.lib + "/bootstrap/bootstrap.min.scss")
		.pipe(newer({
			dest: config.dest.dist + "/lib/bootstrap/bootstrap.min.css",
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
		.pipe(postcss([postcssPresetEnv()])) // will use browserslist config
		.pipe(gulp.dest(config.dest.dist + "/lib/bootstrap"));
};

const jsZip = () => gulp.src(config.src.lib + "/jszip/jszip.ts")
	.pipe(newer({
		dest: config.dest.dist + "/lib/jszip.js",
		extra: [__filename, root + "jszip/package.json"],
	}))
	.pipe(esbuild({
		bundle: true,
		legalComments: "none",
		outfile: "jszip.js",
		minify: true,
		target: "es2016", // for maximal compatibility
	}))
	.pipe(gulp.dest(config.dest.dist + "/lib"));

/**
 * Directly copy or custom build files from node_modules for some of the libraries
 */
gulp.task("lib", () => all(
	bootstrapJS(),
	bootstrapCSS(),
	jsZip(),
	pixiCore(),
	pixi(),
	quickCopy("vue/dist/vue.runtime.global.js", true),
	quickCopy("vue/dist/vue.runtime.global.prod.js"),
	quickCopy("vue-i18n/dist/vue-i18n.runtime.global.prod.js"),
	quickCopy("../lib/lzma/lzma_worker-min.js")
));
