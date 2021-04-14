"use strict";
var through = require('through2');

// 用來把 locale 檔案的順序排列得跟來源語系檔按的順序一樣

function copyInOrderOf(source, order) {
	if(typeof (source) != "object" || Array.isArray(source)) return source;
	let result = {};
	for(let key in order) result[key] = copyInOrderOf(source[key], order[key]);
	return result;
}
function toJSON(file) {
	if(!file.contents) debugger;
	let content = file.contents.toString('utf8');
	try {
		return JSON.parse(content);
	} catch(e) {
		debugger;
	}

}

module.exports = function(sourceName) {
	let files = [];
	let source;

	function bufferContents(file, enc, cb) {
		if(file.isNull()) return cb();
		if(file.isStream()) {
			this.emit('error', new Error('order: Streaming not supported'));
			return cb();
		}
		if(file.extname != ".json") return cb(null, file);

		if(file.basename == sourceName) source = file;
		else files.push(file);
		cb();
	}

	function endStream(cb) {
		if(!source) {
			if(!files.length) return cb();
			this.push(...files);
		} else {
			this.push(source);
			source = toJSON(source);
			for(let file of files) {
				let json = toJSON(file);
				let result = JSON.stringify(copyInOrderOf(json, source), null, "\t") + "\n";
				file.contents = Buffer.from(result, 'utf8');
				this.push(file);
			}
		}
		cb();
	}

	return through.obj(bufferContents, endStream);
};
