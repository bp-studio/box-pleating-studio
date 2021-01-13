"use strict";
const through = require("through2");
const workbox = require("workbox-build");

function wb(options) {
	return through.obj(function transform(file, encoding, callback) {
		if(file.isNull()) return callback(null, file);
		if(file.isStream()) {
			console.log('Cannot use streamed files');
			return callback();
		}
		let content = file.contents.toString(encoding || 'utf8');

		// 注入清單
		workbox.getManifest(options).then(({ manifestEntries }) => {
			let result = content.replace("self.__WB_MANIFEST", JSON.stringify(manifestEntries));
			file.contents = Buffer.from(result, encoding);
			callback(null, file);
		});
	});
}
module.exports = wb;
