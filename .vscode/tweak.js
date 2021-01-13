"use strict";
const through = require("through2");

function tweak(t, filename) {
	return through.obj(function transform(file, encoding, callback) {
		if(file.isNull() || file.isStream()) return callback(null, file);
		if(!t || filename !== undefined && file.basename != filename) return callback(null, file);

		let content = file.contents.toString(encoding || 'utf8');
		let result = t(content);
		file.contents = Buffer.from(result, encoding);
		return callback(null, file);
	});
}
module.exports = tweak;
