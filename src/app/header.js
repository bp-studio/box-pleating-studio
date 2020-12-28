
if(typeof (TextDecoder) == "undefined") throw new Error("TextDecoder is needed");

let bp = new BPStudio("#divWorkspace");

function sanitize(filename) {
	let c = '/\\:*|"<>'.split(''), r = "∕∖∶∗∣″‹›".split('');
	for(let i in c) filename = filename.replace(RegExp("\\" + c[i], "g"), r[i])
	return filename
		.replace(/\?/g, "ʔ̣")
		.replace(/\s+/g, " ")
		.replace(/[\x00-\x1f\x80-\x9f]/g, "")
		.replace(/^\.*$/, "project")
		.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, "project")
		.replace(/[\. ]+$/, "project");
}

function readFile(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = e => resolve(e.target.result);
		reader.onerror = e => reject(e);
		reader.readAsArrayBuffer(file); // readAsText 可能無法完整讀取 binary 檔案
	});
}

const LZ = {
	compress(s) {
		s = LZMA.compress(s, 1); // Experiments showed that 1 is good enough
		s = btoa(String.fromCharCode.apply(null, Uint8Array.from(s)));
		return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+/g, ""); // urlBase64
	},
	decompress(s) {
		// There's no need to add padding "=" back since atob() can infer it.
		s = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
		const bytes = new Uint8Array(s.length);
		for(let i = 0; i < bytes.length; i++) bytes[i] = s.charCodeAt(i);
		return LZMA.decompress(bytes);
	}
}
