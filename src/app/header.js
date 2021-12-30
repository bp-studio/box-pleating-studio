/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-undef */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

document.addEventListener("wheel", (event) => {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });

// 底下的幾個變數宣告成 const 或 let 在 Safari 會無法被提升到 if 的 scope 之外

/**
 * 判斷是否當前的環境為桌機版的 Mac
 *
 * 這邊採用的判別方法參見 https://stackoverflow.com/questions/10527983/
 */
var isMac = navigator.platform.toLowerCase().startsWith("mac");
if(isMac) document.body.classList.add("mac");

/** 是否在 PWA 模式中執行 */
var isPWA = matchMedia("(display-mode: standalone)").matches;

/** 是否支援原生檔案 API */
var isFileApiEnabled = typeof window.showSaveFilePicker != 'undefined';

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
// Dropdown
///////////////////////////////////////////////////

var dropdown = {};
