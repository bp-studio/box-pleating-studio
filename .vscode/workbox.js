"use strict";
const through = require("through2");
const workbox = require("workbox-build");
const fs = require('fs');

let config;
let target = "dist/index.htm";

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}

	let content = file.contents.toString(encoding || 'utf8');

	// 增加 build number
	let html = fs.readFileSync(target, { encoding: 'utf8' });
	html = html.replace(/app_version: "(\d+)"/,	(a, b) => `app_version: "${Number(b) + 1}"`);
	fs.writeFileSync(target, html);

	// 注入清單
	workbox.getManifest(config).then(({ manifestEntries }) => {
		let result = content.replace("self.__WB_MANIFEST", JSON.stringify(manifestEntries));
		file.contents = Buffer.from(result, encoding);
		callback(null, file);
	});
}
function wb(options) {
	config = options;
	return through.obj(transform);
}
module.exports = wb;
