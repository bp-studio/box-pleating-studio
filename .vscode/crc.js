"use strict";
const through = require("through2");
const crc32 = require("crc").crc32;
const fs = require('fs');

let target = "dist/index.htm";

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}

	let content = file.contents.toString(encoding || 'utf8');
	let sum = crc32(content).toString(16);
	let filename = file.basename;

	if(typeof target == "string") write(target, filename, sum);
	else if(Array.isArray(target)) for(let t of target) write(t, filename, sum);

	return callback(null, file);
}

function write(target, filename, sum) {
	let html = fs.readFileSync(target, { encoding: 'utf8' });
	let reg = RegExp(filename + "\\?\\w+");
	let replace = filename + "?" + sum;
	let m = html.match(reg);
	if(m && m[0] != replace) {
		html = html.replace(reg, replace);
		html = html.replace(/<meta name="build" content="(\d+)">/,
			(a, b) => `<meta name="build" content="${Number(b) + 1}">`);
	}
	fs.writeFileSync(target, html);
}

function crc(t) {
	if(t) target = t;
	return through.obj(transform);
}
module.exports = crc;
