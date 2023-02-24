const fs = require("fs");
const esbuild = require("gulp-esbuild");
const gulp = require("gulp");
const terser = require("gulp-terser");
const workbox = require("gulp-workbox");

const config = require("../config.json");
const { target } = require("../utils/esbuild");

gulp.task("sw", () => {
	// Find the last log
	const dir = fs.opendirSync(config.dest.dist + "/log");
	let file, lastLog;
	while((file = dir.readSync()) && file.isFile()) {
		const [stem, ext] = file.name.split(".");
		if(ext == "md" && (!lastLog || stem > lastLog)) lastLog = stem;
	}
	dir.closeSync();

	return gulp.src(config.src.sw + "/sw.ts")
		.pipe(esbuild({
			bundle: true,
			treeShaking: true,
			legalComments: "none",
			target,
			charset: "utf8",
		}))
		.pipe(workbox({
			globDirectory: config.dest.dist,
			globPatterns: [
				"**/*.htm",
				"**/*.js",
				"**/*.css",
				"**/*.woff2",
				"manifest.json",

				// Only precache the two most common resolution; see https://tinyurl.com/7rxv5f97
				"assets/icon/icon-32.png",
				"assets/icon/icon-192.png",

				// Only the last log will be included in precache
				`log/${lastLog}.md`,
			],
			globIgnores: ["sw.js"],
		}))
		.pipe(terser())
		.pipe(gulp.dest(config.dest.dist));
});
