const $ = require("../utils/proxy");
const gulp = require("gulp");

const config = require("../config.json");

gulp.task("testPolyBoolHTML", () =>
	gulp.src(config.src.test + "/polyBool/index.htm")
		.pipe(gulp.dest(config.dest.test))
);

gulp.task("testPolyBoolJS", () =>
	gulp.src(config.src.test + "/polyBool/index.ts")
		.pipe($.esbuild({
			outfile: "index.js",
			bundle: true,
			treeShaking: true,
			sourcemap: "linked",
			sourcesContent: false,
			sourceRoot: "../../",
		}))
		.pipe(gulp.dest(config.dest.test))
);

gulp.task("testPolyBool", gulp.series("testPolyBoolHTML", "testPolyBoolJS"));
