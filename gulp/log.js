"use strict";
var through = require('through2');
var path = require('path');

module.exports = function(file) {
	var latestFile;
	var concat = [];

	function bufferContents(file, enc, cb) {
		if(file.isNull()) return cb();
		if(file.isStream()) {
			this.emit('error', new Error('log: Streaming not supported'));
			return cb();
		}

		latestFile = file;
		concat.push(file.stem);
		cb();
	}

	function endStream(cb) {
		if(!latestFile || !concat.length) return cb();

		let joinedFile = latestFile.clone({ contents: false });
		joinedFile.path = path.join(latestFile.base, file);
		joinedFile.contents = Buffer.from("let logs=[" + concat.join(',') + "]", "utf8");
		this.push(joinedFile);
		cb();
	}

	return through.obj(bufferContents, endStream);
};
