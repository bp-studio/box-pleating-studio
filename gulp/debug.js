"use strict";
const through = require("through2");

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}
	if(file.extname != ".htm") return callback(null, file);

	encoding = encoding || 'utf8'
	let content = file.contents.toString(encoding);

	// 變換基底
	content = content.replace('</title>', '</title>\n\t<base href="../dist/">');

	// 本地端測試檔案的修改
	content = content.replace(
		'<script async src="https://www.googletagmanager.com/gtag/js?id=G-GG1TEZGBCQ"></script>',
		`<script>
		// Local fetch polyfill
		let org_fetch = fetch;
		fetch = function(url) {
			if(url.startsWith("h")) return org_fetch(url);
			else return new Promise(resolve => {
				let oReq = new XMLHttpRequest();
				oReq.addEventListener("load", e =>
					resolve({ text: () => e.target.responseText })
				);
				oReq.open("GET", url);
				oReq.send();
			})
		};
	</script>`
	);
	content = content.replace('<link rel="manifest" href="manifest.json">', "");

	// 替換成偵錯版資源
	content = content.replace('main.js', '../debug/main.js');
	content = content.replace('lib/vue.runtime.min.js', '../debug/vue.runtime.js');
	content = content.replace('lib/paper-core.min.js', '../debug/paper-core.js');
	content = content.replace('shrewd.min.js', '../debug/shrewd.js');
	content = content.replace('bpstudio.js', '../debug/bpstudio.js');

	file.contents = Buffer.from(content, encoding);
	return callback(null, file);
}
function env() {
	return through.obj(transform);
}
module.exports = env;
