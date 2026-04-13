import fontawesome from "gulp-fontawesome";
import gulp from "gulp";
import through2 from "gulp-through2";
import { FontAssetType, OtherAssetType, generateFonts } from "fantasticon";
import { existsSync, mkdirSync } from "fs";

import config from "../config.json" with { type: "json" };

gulp.task("icon", () => {
	const dest = "./build/temp/bps";
	if(!existsSync(dest)) mkdirSync(dest, { recursive: true });

	return generateFonts({
		name: "bps",
		inputDir: "./src/other/icons/dist",
		outputDir: dest,
		fontTypes: [FontAssetType.WOFF2, FontAssetType.TTF],
		assetTypes: [OtherAssetType.CSS],
		prefix: "bp",
		pathOptions: {
			css: `${dest}/style.css`,
		},
		getIconId: ({ basename }) => basename,
	});
});

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
