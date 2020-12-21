"use strict";
const through = require("through2");
const transpiler = require("vue-property-decorator-transpiler");
const compile = require('vue-template-compiler');

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}
	if(file.extname != ".vue" && file.extname != ".ts") return callback(null, file);

	let content = file.contents.toString(encoding || 'utf8');
	let result;

	if(file.extname == ".ts") {
		// ts 檔案編譯成 mixin
		result = transpiler(content, undefined, true);
	} else {
		// vue 檔案編譯成元件
		let component = compile.parseComponent(content);
		result = transpiler(component.script.content, component.template.content);
	}

	file.extname = ".js";
	file.contents = Buffer.from(result, encoding);
	return callback(null, file);
}
function gvpd() {
	return through.obj(transform);
}
module.exports = gvpd;
