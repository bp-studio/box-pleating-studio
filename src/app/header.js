/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-undef */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

document.addEventListener("wheel", (event) => {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });

// 這邊宣告成 const 或 let 在 Safari 會無法被提升到 if 的 scope 之外，底下其它變數亦同
var isMac = navigator.platform.toLowerCase().startsWith("mac");

// 是否在 PWA 模式中執行
var isPWA = matchMedia("(display-mode: standalone)").matches;

// 是否支援原生檔案 API
var isFileApiEnabled = typeof window.showSaveFilePicker != 'undefined';

///////////////////////////////////////////////////
// 公用函數
///////////////////////////////////////////////////

function zoomStep(zoom) {
	const FULL_ZOOM = 100, ZOOM_STEP = 25;
	return 2 ** Math.floor(Math.log2(zoom / FULL_ZOOM)) * ZOOM_STEP;
}

///////////////////////////////////////////////////
// 檔案處理
///////////////////////////////////////////////////

function sanitize(filename) {
	let c = '/\\:*|"<>'.split(''), r = "∕∖∶∗∣″‹›".split('');
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

function defaultHotkey() {
	return {
		view: {
			tree: '1',
			layout: '2',
			"zoom in": 'X',
			"zoom out": 'Z',
		},
		control: {
			up: 'W',
			down: 'S',
			left: 'A',
			right: 'D',
		},
		action: {
			"radius/length increase": 'E',
			"radius/length decrease": 'Q',
			"height increase": 'sW',
			"height decrease": 'sS',
			"width increase": 'sD',
			"width decrease": 'sA',
		},
	};
}

var _keymap = ['!@#$%^&*()_+{}|:"<>?~', "1234567890-=[]\\;',./`"];

function toKey(e) {
	let key = e.key.toUpperCase();
	if(key.match(/^[A-Z]$/) && e.shiftKey) key = 's' + key;
	return key;
}

function findKey(key, store) {
	for(let name in store) {
		for(let command in store[name]) {
			if(store[name][command] == key) {
				return name + '.' + command;
			}
		}
	}
	return null;
}

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
	e => {
		// 設置攔截例外
		let k = e.key.toLowerCase();
		if((k == "s" || k == "o" || k == "p") && (e.metaKey || e.ctrlKey)) return;

		// 如果正在使用輸入框，把一切的正常事件監聽都阻斷掉
		let active = document.activeElement;
		if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
			e.stopImmediatePropagation();
		}
	},
	{ capture: true }
);

registerHotkeyCore(e => {
	// 有對話方塊打開的話一律不處理通常的快速鍵
	if(document.querySelector('.modal-open')) return;

	if(e.metaKey || e.ctrlKey || e.key == "Escape") {
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
