const gulp = require("gulp");
const through2 = require("gulp-through2");
const fontawesome = require("gulp-fontawesome");

const config = require("../config.json");

function woff2(stem) {
	if(!stem) throw new Error("Woff2 error: must specify filename.");
	let ttf;
	const reg = new RegExp("(src:\\n(\\s+))(url\\('fonts\\/" +
		stem + ".ttf\\?(......)'\\) format\\('truetype'\\))");

	return through2({
		name: "woff2",
		transform(content, file) {
			// These are redundant considering our target browser versions
			if(file.extname == ".svg" || file.extname == ".woff") return null;

			// We keep the .ttf format since Safari 11 has limited support for woff2
			if(file.extname == ".ttf") ttf = file;

			if(file.extname == ".css") {
				return content
					.replace(reg, "$1url('fonts/" + stem + ".woff2') format('woff2'),\n$2$3")
					.replace(/(?<=format\('truetype'\)).+?;/s, ";");
			}
		},
		async flush(files) {
			if(ttf) {
				const ttf2woff2 = (await import("ttf2woff2")).default;
				const file = ttf.clone({ contents: false });
				file.extname = ".woff2";
				file.contents = ttf2woff2(ttf.contents);
				files.push(file);
			}
		},
	});
};

const buildIcon = () =>
	gulp.src(config.src.icon + "/bps/**/*", {
		encoding: false, // Gulp v5
	})
		.pipe(woff2("bps"))
		.pipe(gulp.dest(config.dest.temp + "/bps"));

gulp.task("icon", buildIcon);

/** FontAwesome */
const faTarget = config.dest.temp + "/font-awesome";
const fontAwesome = () =>
	gulp.src(config.src.app + "/vue/**/*.vue")
		.pipe(fontawesome())
		.pipe(gulp.dest(faTarget));

/**
 * This is the task for rebuilding FontAwesome.
 * Needs to be called manually.
*
* Note: For unknown reason, it appears that in local environment,
* restarting the browser is needed for the new font to take effect.
*/
gulp.task("fa", fontAwesome);

gulp.task("static", gulp.parallel("fa", "icon"));

/** Bump build version */
gulp.task("version", () =>
	gulp.src("package.json")
		.pipe(through2(c => c.replace(/"app_version": "(\d+)"/, (a, b) => `"app_version": "${Number(b) + 1}"`)))
		.pipe(gulp.dest("."))
);
