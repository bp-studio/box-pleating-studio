const { readFileSync } = require("fs");
const through2 = require("gulp-through2");

// 用來產生偵錯版本建置

module.exports = () => through2({
	name: "html-debug",
	filter: ".htm",
	transform(content) {
		// 變換基底
		content = content.replace("</title>", '</title>\n\t<base href="../dist/">');

		// 要注入到偵錯版的 polyfill
		const script = readFileSync("src/other/debug/polyfill.js");
		const polyfill = `<!-- Local polyfill -->\n<script>\n${script}</script>`.replaceAll("\n", "\n\t");

		// 本地端測試檔案的修改
		content = content.replace('<link rel="manifest" href="manifest.json">', "");
		content = content.replace(/<!-- Global site tag .+?<\/script>/s, polyfill);

		// 替換成偵錯版資源；replaceAll 是 es2021 的新語法
		content = content.replaceAll("main.css", "../debug/main.css");
		content = content.replaceAll("main.js", "../debug/main.js");
		content = content.replaceAll("core.js", "../debug/core.js");
		content = content.replaceAll("client.js", "../debug/client.js");
		content = content.replaceAll("lib/vue.runtime.global.prod.js", "../debug/lib/vue.runtime.global.js");

		return content;
	},
});
