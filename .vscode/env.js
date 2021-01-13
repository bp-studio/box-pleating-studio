"use strict";
const through = require("through2");

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}
	if(file.extname != ".htm") return callback(null, file);

	encoding = encoding || 'utf8'
	let content = file.contents.toString(encoding);
	this.push(file);

	// 本地端測試檔案不加上 manifest
	let local = file.clone({ contents: false });
	local.extname = ".html";
	local.contents = Buffer.from(content.replace('<link rel="manifest" href="manifest.json">', ""), encoding);
	this.push(local);

	return callback();
}
function env() {
	return through.obj(transform);
}
module.exports = env;
