const through = require("through2");

// 用來產生偵錯版本建置

// 要注入到偵錯版的 polyfill
const polyfill = `<!-- Local polyfill -->
	<script>
		(function() {
			// fetch
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

			// broadcast channel
			const bc = new BroadcastChannel('bp_channel');
			let res;
			bc.onmessage = function(event) {
				if(typeof event.data == 'number') {
					if(event.data > core.id) bc.postMessage([event.data]);
				} else {
					if(event.data[0] == core.id) res(false);
				}
			}
			window.checkWithBC = function() {
				return new Promise(resolve => {
					res = resolve;
					bc.postMessage(core.id);
					setTimeout(() => res(true), 50);
				})
			}
		})();
	</script>`;

function transform(file, encoding, callback) {
	if(file.isNull()) return callback(null, file);
	if(file.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}
	if(file.extname != ".htm") return callback(null, file);

	encoding = encoding || 'utf8';
	let content = file.contents.toString(encoding);

	// 變換基底
	content = content.replace('</title>', '</title>\n\t<base href="../dist/">');

	// 本地端測試檔案的修改
	content = content.replace('<link rel="manifest" href="manifest.json">', "");
	content = content.replace(/<link rel="preload" [^>]+>/g, "");
	content = content.replace(/<!-- Global site tag .+?<\/script>/s, polyfill);

	// 替換成偵錯版資源
	content = content.replace('main.js', '../debug/main.js');
	content = content.replace('lib/vue.runtime.min.js', '../debug/lib/vue.runtime.js');
	content = content.replace('lib/paper-core.min.js', '../debug/lib/paper-core.js');
	content = content.replace('lib/shrewd.min.js', '../debug/lib/shrewd.js');
	content = content.replace('bpstudio.js', '../debug/bpstudio.js');

	file.contents = Buffer.from(content, encoding);
	return callback(null, file);
}
function env() {
	return through.obj(transform);
}
module.exports = env;
