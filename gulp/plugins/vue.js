
const through = require("through2");
const transpiler = require("vue-property-decorator-transpiler");
const compile = require('vue-template-compiler');

// 用來編譯 Vue SFC 專案

// eslint-disable-next-line max-lines-per-function
module.exports = function(jsName, cssName) {
	let js = [], css = [];
	let baseFile;

	function bufferContents(file, encoding, callback) {
		if(file.isNull()) return callback(null, file);
		if(file.isStream()) {
			console.log('Cannot use streamed files');
			return callback();
		}
		if(
			file.extname != ".vue" && file.extname != ".ts" &&
			file.extname != ".css" && file.extname != ".js"
		) {
			return callback(null, file);
		}

		let content = file.contents.toString(encoding || 'utf8');
		if(file.extname == ".ts") {
			// ts 檔案編譯成 mixin
			js.push(transpiler(content, undefined, true));
		} else if(file.extname == ".js") {
			js.push(content);
		} else if(file.extname == ".css") {
			css.push(content);
		} else {
			// vue 檔案編譯成元件
			let component = compile.parseComponent(content);
			js.push(transpiler(component.script.content, component.template.content));
			css.push(...component.styles.map(c => c.content));
		}

		if(!baseFile || baseFile.base.length > file.base.length) baseFile = file;
		return callback();
	}

	function endStream(cb) {
		if(baseFile) {
			let file = baseFile.clone({ contents: false });
			file.path = baseFile.base + "/" + jsName;
			file.contents = Buffer.from(js.join(''), "utf8");
			this.push(file);

			if(cssName) {
				file = baseFile.clone({ contents: false });
				file.path = baseFile.base + "/" + cssName;
				file.contents = Buffer.from(css.join(''), "utf8");
				this.push(file);
			}
		}
		cb();
	}

	return through.obj(bufferContents, endStream);
};

