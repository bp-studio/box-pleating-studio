/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-undef */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

if(typeof TextDecoder == "undefined") throw new Error("TextDecoder is needed");

document.addEventListener("wheel", (event) => {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });

// 這邊宣告成 const 或 let 在 Safari 會無法被提升到 if 的 scope 之外，底下其它變數亦同
var isMac = navigator.platform.toLowerCase().startsWith("mac");

// 是否支援原生檔案 API
var nativeFileEnabled = typeof window.showSaveFilePicker != 'undefined';

///////////////////////////////////////////////////
// 檔案處理
///////////////////////////////////////////////////

function sanitize(filename) {
	let c = '/\\:*|"<>'.split(''), r = "∕∖∶∗∣″‹›".split('');
	// eslint-disable-next-line guard-for-in
	for(let i in c) filename = filename.replace(RegExp("\\" + c[i], "g"), r[i]);
	return filename
		.replace(/\?/g, "ʔ̣")
		.replace(/\s+/g, " ")
		// eslint-disable-next-line no-control-regex
		.replace(/[\x00-\x1f\x80-\x9f]/g, "")
		.replace(/^\.*$/, "project")
		.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, "project")
		.replace(/[. ]+$/, "project");
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
				var channel = new MessageChannel();
				channel.port1.onmessage = event => resolve(event.data);
				reg.active.postMessage(data, [channel.port2]);
			}, () => reject());
		} else {
			reject();
		}
	});
}
if('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', event => {
		if(event.data == "id") event.ports[0].postMessage(core.id);
	});
}

///////////////////////////////////////////////////
// LZMA
///////////////////////////////////////////////////

var LZ = {
	compress(s) {
		s = LZMA.compress(s, 1); // Experiments showed that 1 is good enough
		s = btoa(String.fromCharCode.apply(null, Uint8Array.from(s)));
		return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/[=]+/g, ""); // urlBase64
	},
	decompress(s) {
		// There's no need to add padding "=" back since atob() can infer it.
		s = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
		const bytes = new Uint8Array(s.length);
		for(let i = 0; i < bytes.length; i++) bytes[i] = s.charCodeAt(i);
		return LZMA.decompress(bytes);
	},
};

///////////////////////////////////////////////////
// 快捷鍵註冊
///////////////////////////////////////////////////

var hotkeys = [];

function registerHotkey(action, key, shift) {
	hotkeys.push([action, key.toLowerCase(), Boolean(shift)]);
}

function registerHotkeyCore(handler) {
	document.body.addEventListener("keydown", handler);
	return handler;
}

function unregisterHotkeyCore(handler) {
	document.body.removeEventListener("keydown", handler);
}

document.addEventListener(
	'keydown',
	event => {
		// 設置攔截例外
		let k = event.key.toLowerCase();
		if(k == "s" || k == "o" || k == "p") return;

		// 如果正在使用輸入框，把一切的正常事件監聽都阻斷掉
		let active = document.activeElement;
		if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
			event.stopImmediatePropagation();
		}
	},
	{ capture: true }
);

registerHotkeyCore(e => {
	if(e.metaKey || e.ctrlKey) {
		e.preventDefault();
		for(let [action, key, shift] of hotkeys) {
			if(e.key.toLowerCase() == key && e.shiftKey == shift) {
				action();
				return;
			}
		}
	}
});

///////////////////////////////////////////////////
// Dropdown
///////////////////////////////////////////////////

var dropdown = {};
