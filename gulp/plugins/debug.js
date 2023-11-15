const through2 = require("gulp-through2");

// For building the debug version

module.exports = () => through2({
	name: "html-debug",
	filter: ".htm",
	transform(content) {
		// Modifications for local testing
		content = content.replace('<link rel="manifest" href="manifest.json">', "");
		content = content.replace(/<!-- Global site tag .+?<\/script>/s, "");

		return content;
	},
});
