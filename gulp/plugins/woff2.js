const through2 = require("gulp-through2");
const ttf2woff2 = require("ttf2woff2");

// 用來把 IcoMoon 輸出的 ttf 轉換成 woff2 並且修改對應的 CSS

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
		flush(files) {
			if(ttf) {
				const woff2 = ttf.clone({ contents: false });
				woff2.extname = ".woff2";
				woff2.contents = ttf2woff2(ttf.contents);
				files.push(woff2);
			}
		},
	});
};
