const { readFileSync } = require("fs");
const through2 = require("gulp-through2");

// For building the debug version

module.exports = () => through2({
	name: "html-debug",
	filter: ".htm",
	transform(content) {
		// Change the base
		content = content.replace("</title>", '</title>\n\t<base href="../dist/">');

		// Inject polyfills
		const script = readFileSync("src/other/debug/polyfill.js");
		const polyfill = `<!-- Local polyfill -->\n<script>\n${script}</script>`.replaceAll("\n", "\n\t");

		// Modifications for local testing
		content = content.replace('<link rel="manifest" href="manifest.json">', "");
		content = content.replace(/<!-- Global site tag .+?<\/script>/s, polyfill);

		// Use debug assets instead. `replaceAll` is new in es2021.
		content = content.replaceAll("main.css", "../debug/main.css");
		content = content.replaceAll("main.js", "../debug/main.js");
		content = content.replaceAll(/(?<!\.)core.js/g, "../debug/core.js");
		content = content.replaceAll("client.js", "../debug/client.js");
		content = content.replaceAll("lib/vue.runtime.global.prod.js", "../debug/lib/vue.runtime.global.js");

		return content;
	},
});
