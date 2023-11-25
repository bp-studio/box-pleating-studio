const gulp = require("gulp");

const config = require("../config.json");

const links = [
	"log",
	"lib",
	"assets",
	"donate.htm",
	"donate.js",
	"locale.js",
];

gulp.task("link", () =>
	// Note: symlink for individual files works in serve only when using "-S" option
	// http-server on the other hand accepts those by default.
	gulp.src(links, { cwd: config.dest.dist })
		.pipe(gulp.symlink(config.dest.debug, { useJunctions: false }))
);
