const fs = require("fs");
const os = require("os");
const path = require("path");
const through2 = require("gulp-through2");

// For collecting the usage of FontAwesome

module.exports = () => {
	const subset = {
		regular: new Set(),
		solid: new Set(),
		brands: new Set(),
	};
	return through2({
		name: "font-awesome",
		filter: ".vue",
		transform(content) {
			const matches = content.matchAll(/fa([srb]) fa-([a-z-]+[a-z])/g);
			for(const match of matches) {
				const type = match[1];
				if(type == "s") subset.solid.add(match[2]);
				else if(type == "b") subset.brands.add(match[2]);
				else subset.regular.add(match[2]);
			}
		},
		async flush(files) {
			if(!files.length) return;
			const fas = await import("fontawesome-subset");
			subset.regular = [...subset.regular];
			subset.solid = [...subset.solid];
			subset.brands = [...subset.brands];

			const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fa-"));
			await fas.fontawesomeSubset(subset, temp);

			const result = [];
			for(const filename of fs.readdirSync(temp)) {
				const filePath = path.join(temp, filename);
				const file = files[0].clone({ contents: false });
				file.basename = filename;
				file.contents = fs.readFileSync(filePath);
				result.push(file);
				fs.rmSync(filePath);
			}

			fs.rmdirSync(temp);

			return result;
		},
	});
};
