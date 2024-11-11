const gulp = require("gulp");
const esbuild = require("gulp-esbuild");

const config = require("../config.json");

gulp.task("toolPolyBoolHTML", () =>
	gulp.src(config.src.tool + "/polyBool/index.htm")
		.pipe(gulp.dest(config.dest.tool))
);

gulp.task("toolPolyBoolJS", () =>
	gulp.src(config.src.tool + "/polyBool/index.ts")
		.pipe(esbuild({
			outfile: "index.js",
			bundle: true,
			treeShaking: true,
			sourcemap: "linked",
			sourcesContent: false,
			sourceRoot: "../../",
		}))
		.pipe(gulp.dest(config.dest.tool))
);

gulp.task("toolPolyBool", gulp.series("toolPolyBoolHTML", "toolPolyBoolJS"));
