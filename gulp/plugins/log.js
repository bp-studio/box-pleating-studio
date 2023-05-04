const through2 = require("gulp-through2");
const path = require("path");

// For building the log indices and preload manifest

module.exports = function(outFile, libs) {
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

	return through2({
		name: "log",
		async transform(content) {
			return (await import("marked")).marked.parse(content, {
				headerIds: false,
				mangle: false,
				langPrefix: "",
			});
		},
		flush(files) {
			if(!files.length) return;
			const lastFile = files[files.length - 1];
			const stems = files.map(f => f.stem).join(",");
			const joinedFile = lastFile.clone({ contents: false });
			joinedFile.path = path.join(lastFile.base, outFile);
			through2.write(joinedFile, "let logs=[" + stems + "];" + preload);
			files.push(joinedFile);
		},
	});
};
