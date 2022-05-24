const through2 = require("gulp-through2");

// 用來把 locale 檔案的順序排列得跟來源語系檔按的順序一樣

function copyInOrderOf(source, order) {
	if(typeof source != "object" || Array.isArray(source)) return source;
	const result = {};
	// eslint-disable-next-line guard-for-in
	for(const key in order) result[key] = copyInOrderOf(source[key], order[key]);
	return result;
}

module.exports = function(sourceName) {
	let source;
	return through2({
		name: "locale-order",
		filter: ".json",
		transform(_, file) {
			if(file.basename == sourceName) {
				source = file;
				return null;
			}
		},
		flush(files) {
			if(!source) return;
			this.push(source);
			source = JSON.parse(through2.read(source));
			for(const file of files) {
				const json = JSON.parse(through2.read(file));
				const result = JSON.stringify(copyInOrderOf(json, source), null, "\t") + "\n";
				through2.write(file, result);
			}
		},
	});
};
