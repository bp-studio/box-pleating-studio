const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");
const { target, extra: ext, sourceMap, ifdef } = require("../utils/esbuild");
const extra = [__filename, ext, config.src.core + "/**/*", config.src.shared + "/**/*"];

function esb(options) {
	return $.esbuild(Object.assign({}, {
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
		.pipe(esb({
			define: {
				DEBUG_ENABLED: "true",
				TEST_MODE: "false",
			},
			sourcemap: "external",
			sourcesContent: false,
			sourceRoot: "../../",
			plugins: [ifdef(true)],
		}))
		.pipe(sourceMap())
		.pipe(gulp.dest(config.dest.debug, { sourcemaps: "." }))
);

gulp.task("coreDist", () =>
	gulp.src(config.src.core + "/main.ts")
		.pipe(newer({
			dest: config.dest.dist + "/core.js",
			extra,
		}))
		.pipe(esb({
			define: {
				DEBUG_ENABLED: "false",
				TEST_MODE: "false",
			},
			minify: true,
			mangleProps: /^[$_]/,
			plugins: [ifdef(false)],
		}))
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task("core", gulp.parallel("coreDebug", "coreDist"));
