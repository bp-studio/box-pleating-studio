const esbuild = require("gulp-esbuild");
const gulp = require("gulp");
const replace = require("gulp-replace");
const terser = require("gulp-terser");

const newer = require("../utils/newer");
const config = require("../config.json");
const { target, extra: ext, sourceMap } = require("../utils/esbuild");
const extra = [__filename, ext, config.src.core + "/**/*", config.src.shared + "/**/*"];

function esb(options) {
	return esbuild(Object.assign({}, {
		outfile: "core.js",
		bundle: true,
		target,
		treeShaking: true,
		tsconfig: config.src.core + "/tsconfig.json",
		globalName: "bp",
	}, options || {}));
}

gulp.task("coreDebug", () =>
	gulp.src(config.src.core + "/main.ts")
		.pipe(newer({
			dest: config.dest.debug + "/core.js",
			extra,
		}))
		.pipe(esb({ sourcemap: "external", sourcesContent: false, sourceRoot: "../../" }))
		.pipe(sourceMap())
		.pipe(terser({
			ecma: 2018,
			compress: {
				defaults: false,
				drop_debugger: false,
				global_defs: {
					DEBUG_ENABLED: true,
					TEST_MODE: false,
				},
			},
			mangle: false,
			format: {
				beautify: true,
				comments: true,
			},
		}))
		.pipe(gulp.dest(config.dest.debug, { sourcemaps: "." }))
);

gulp.task("coreDist", () =>
	gulp.src(config.src.core + "/main.ts")
		.pipe(newer({
			dest: config.dest.dist + "/core.js",
			extra,
		}))
		.pipe(esb({ minify: true })) // 即使有 terser，設置這個還是會再改進一點點
		.pipe(replace(/(["'])[$_][a-z_0-9]+\1/gi, "$$$$$$$$[$&]")) // Prepare decorator mangling
		.pipe(terser({
			ecma: 2018,
			compress: {
				drop_debugger: false,
				global_defs: {
					DEBUG_ENABLED: false,
					TEST_MODE: false,
				},
			},
			mangle: { properties: { regex: /^[$_]/ } },
			format: {
				comments: false,
			},
		}))
		.pipe(replace(/\$\$\$\$\.([a-z$_][a-z$_0-9]*)/gi, "'$1'")) // Restore
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task("core", gulp.parallel("coreDebug", "coreDist"));
