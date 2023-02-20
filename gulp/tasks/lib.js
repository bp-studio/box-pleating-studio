const all = require("gulp-all");
const esbuild = require("gulp-esbuild");
const exg = require("esbuild-plugin-external-global").externalGlobalPlugin;
const fs = require("fs");
const gulp = require("gulp");
const gulpSass = require("gulp-sass");
const replace = require("gulp-replace");
const sass = require("sass");

const newer = require("../utils/newer");
const config = require("../config.json");
const { purge, extra } = require("../utils/purge");

const root = "node_modules/";
const removeSourceMaps = () => replace(/\/\/# sourceMappingURL=.*/g, "");

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
				root + "bootstrap/package.json",
				...extra,
			],
		}))
		.pipe(gulpSass(sass)({
			outputStyle: "compressed",
		}));
	stream = purge(stream);
	return stream.pipe(gulp.dest(config.dest.dist + "/lib/bootstrap"));
};

// The building method of this package sucks, we can do a lot better ourselves.
const vueDraggable = () => {
	const path = fs.realpathSync(root + "vuedraggable");
	return gulp.src(path + "/src/vuedraggable.js")
		.pipe(newer({
			dest: config.dest.dist + "/lib/bootstrap/vuedraggable.min.js",
			extra: [
				__filename,
				path + "/package.json",
				path + "/../sortablejs/package.json",
			],
		}))
		.pipe(esbuild({
			bundle: true,
			globalName: "VueDraggable",
			legalComments: "none",
			treeShaking: true,
			outfile: "vuedraggable.min.js",
			minify: true,
			target: "es2016", // for maximal compatibility
			plugins: [
				exg({
					"vue": "window.Vue",
				}),
			],
		}))
		.pipe(gulp.dest(config.dest.dist + "/lib"));
};

/**
 * Directly copy or custom build files from node_modules for some of the libraries
 */
gulp.task("lib", () => all(
	bootstrapJS(),
	bootstrapCSS(),
	vueDraggable(),
	quickCopy("vue/dist/vue.runtime.global.js", true),
	quickCopy("vue/dist/vue.runtime.global.prod.js"),
	quickCopy("vue-i18n/dist/vue-i18n.global.prod.js"),
	quickCopy("lzma/src/lzma_worker-min.js"),
	quickCopy("jszip/dist/jszip.min.js")
));
