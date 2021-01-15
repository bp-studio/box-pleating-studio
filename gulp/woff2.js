"use strict";
const through = require("through2");
const ttf2woff2 = require("ttf2woff2");

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}

	if(file.extname == ".ttf" && file.isBuffer()) {
		file.extname = ".woff2";
		file.contents = ttf2woff2(file.contents);
	}
	return callback(null, file);
}
function woff2() {
	return through.obj(transform);
}
module.exports = woff2;
