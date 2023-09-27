const through2 = require("gulp-through2");

// Convert the ttf by IcoMoon to woff2, and modify the CSS file

module.exports = function(stem) {
	if(!stem) throw new Error("Woff2 error: must specify filename.");
	let ttf;
	const reg = new RegExp("(src:\\n(\\s+))(url\\('fonts\\/" +
		stem + ".ttf\\?(......)'\\) format\\('truetype'\\))");

	return through2({
		name: "woff2",
		transform(content, file) {
			if(file.extname == ".ttf") ttf = file;
			if(file.extname == ".css") {
				return content.replace(reg, "$1url('fonts/" + stem + ".woff2') format('woff2'),\n$2$3");
			}
		},
		async flush(files) {
			if(ttf) {
				const ttf2woff2 = (await import("ttf2woff2")).default;
				const woff2 = ttf.clone({ contents: false });
				woff2.extname = ".woff2";
				woff2.contents = ttf2woff2(ttf.contents);
				files.push(woff2);
			}
		},
	});
};
