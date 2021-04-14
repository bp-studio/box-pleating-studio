"use strict";
const through = require("through2");
const ttf2woff2 = require("ttf2woff2");

// 用來把 IcoMoon 輸出的 ttf 轉換成 woff2 並且修改對應的 CSS

module.exports = function(stem) {
	if(!stem) throw new Error('Woff2 error: must specify filename.');
	let ttf;
	let reg = new RegExp("(src:\\n(\\s+))(url\\('fonts\\/" + stem + ".ttf\\?(......)'\\) format\\('truetype'\\))")

	function bufferContents(file, encoding, cb) {
		if(file.isNull()) return cb(null, file);
		if(file.isStream()) {
			this.emit('error', new Error('Streaming not supported'));
			return cb();
		}

		if(file.extname == ".ttf") ttf = file;
		if(file.extname == ".css") {
			let content = file.contents.toString(encoding || 'utf8');
			let result = content.replace(reg, "$1url('fonts/" + stem + ".woff2?$4') format('woff2'),\n$2$3");
			file.contents = Buffer.from(result, encoding);
		}

		return cb(null, file);
	}

	function endStream(cb) {
		if(ttf) {
			let woff2 = ttf.clone({ contents: false });
			woff2.extname = ".woff2";
			woff2.contents = ttf2woff2(ttf.contents);
			this.push(woff2);
		}
		cb();
	}

	return through.obj(bufferContents, endStream);
};
