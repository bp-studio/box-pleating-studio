let through = require('through2');
let path = require('path');

// 用來建立 log 檔案目錄

module.exports = function(outFile) {
	let latestFile;
	let concat = [];

	function bufferContents(file, enc, cb) {
		if(file.isNull()) return cb(null, file);
		if(file.isStream()) {
			this.emit('error', new Error('log: Streaming not supported'));
			return cb();
		}

		latestFile = file;
		concat.push(file.stem);
		cb(null, file);
	}

	function endStream(cb) {
		if(!latestFile || !concat.length) return cb();

		let joinedFile = latestFile.clone({ contents: false });
		joinedFile.path = path.join(latestFile.base, outFile);
		joinedFile.contents = Buffer.from("let logs=[" + concat.join(',') + "]", "utf8");
		this.push(joinedFile);
		cb();
	}

	return through.obj(bufferContents, endStream);
};
