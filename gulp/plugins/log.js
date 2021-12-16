let through = require('through2');
let path = require('path');

// 用來建立 log 檔案目錄和 preload manifest

module.exports = function(outFile, libs) {
	let latestFile;
	let concat = [];

	const preload = `
let libs = ${JSON.stringify(libs)}.map(l => "lib/" + l);

libs.forEach(lib => {
	let link = document.createElement('link');
	link.rel = 'preload';
	link.as = lib.endsWith('js') ? 'script' : 'style';
	link.href = lib;
	document.head.appendChild(link);
});
`;

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
		joinedFile.contents = Buffer.from("let logs=[" + concat.join(',') + "];" + preload, "utf8");
		this.push(joinedFile);
		cb();
	}

	return through.obj(bufferContents, endStream);
};
