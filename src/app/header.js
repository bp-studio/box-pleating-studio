
if(typeof (TextDecoder) == "undefined") throw new Error("TextDecoder is needed");

document.addEventListener("wheel", function(event) {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });

const isMac = navigator.platform.toLowerCase().startsWith("mac");

///////////////////////////////////////////////////
// 檔案處理
///////////////////////////////////////////////////

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
function bufferToText(buffer) {
	return new TextDecoder().decode(new Uint8Array(buffer));
}

///////////////////////////////////////////////////
// Service Worker 溝通
///////////////////////////////////////////////////

function callService(data) {
	return new Promise((resolve, reject) => {
		if('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistration('/').then(reg => {
				if(!reg.active) return reject(); // Safari 在第一次執行的時候可能會進到這裡
				let channel = new MessageChannel();
				channel.port1.onmessage = event => resolve(event.data);
				reg.active.postMessage(data, [channel.port2]);
			}, () => reject());
		} else reject();
	});
}
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
	if(event.data == "id") event.ports[0].postMessage(core.id);
});

///////////////////////////////////////////////////
// LZMA
///////////////////////////////////////////////////

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

///////////////////////////////////////////////////
// Hotkeys
///////////////////////////////////////////////////

const hotkeys = [];

function registerHotkey(action, key, shift) {
	hotkeys.push([action, key.toLowerCase(), !!shift]);
}

document.body.addEventListener("keydown", e => {
	// 如果正在使用輸入框，不處理一切後續
	let active = document.activeElement;
	if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
	if(e.metaKey || e.ctrlKey) {
		e.preventDefault();
		for(let [action, key, shift] of hotkeys) {
			if(e.key.toLowerCase() == key && e.shiftKey == shift) {
				action();
				return;
			}
		}
	}
})
