const through = require("through2");

// 用來彙整語系檔案

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}
	if(file.extname != ".json") return callback(null, file);

	let content = file.contents.toString(encoding || 'utf8');
	let result = `locale['${file.stem.toLowerCase()}']=` + content;
	file.extname = ".js";
	file.contents = Buffer.from(result, encoding);
	return callback(null, file);
}

function crc() {
	return through.obj(transform);
}

module.exports = crc;
