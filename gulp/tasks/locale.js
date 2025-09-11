import gulp from "gulp";
import through2 from "gulp-through2";

import config from "../config.json" with { type: "json" };

function copyInOrderOf(source, ref) {
	if(typeof source != "object" || Array.isArray(source)) return source;
	const result = {};
	for(const key in ref) result[key] = copyInOrderOf(source[key], ref[key]);
	return result;
}

function order(sourceName) {
	let source;
	return through2({
		name: "locale-order",
		filter: ".json",
		transform(_, file) {
			if(file.basename == sourceName) {
				source = file;
				return null;
			}
		},
		flush(files) {
			if(!source) return;
			this.push(source);
			source = JSON.parse(through2.read(source));
			for(const file of files) {
				const json = JSON.parse(through2.read(file));
				const result = JSON.stringify(copyInOrderOf(json, source), null, "\t") + "\n";
				through2.write(file, result);
			}
		},
	});
};

/**
 * For sorting the locale file entries to the same ordering as the source locale.
 * This command is for manual execution only.
 */
gulp.task("locale", () => gulp.src(config.src.locale + "/*.json")
	.pipe(order("en.json"))
	.pipe(gulp.dest(config.src.locale))
);
