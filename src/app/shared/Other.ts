
/**
 * 判斷是否當前的環境為桌機版的 Mac
 *
 * 這邊採用的判別方法參見 https://stackoverflow.com/questions/10527983/
 */
const isMac = navigator.platform.toLowerCase().startsWith("mac");
if(isMac) document.body.classList.add("mac");

/** 是否在 PWA 模式中執行 */
const isPWA = matchMedia("(display-mode: standalone)").matches;

/** 是否支援原生檔案 API */
const isFileApiEnabled = typeof window.showSaveFilePicker != 'undefined';

/** 儲存原始的頁面標題（這會隨著建置版本而有差異） */
const defaultTitle = document.title;

document.addEventListener("wheel", (event: WheelEvent) => {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });

///////////////////////////////////////////////////
// LZMA
///////////////////////////////////////////////////

const LZ = {
	compress(s: string): string {
		let arr = LZMA.compress(s, 1); // Experiments showed that 1 is good enough
		s = btoa(String.fromCharCode.apply(null, Uint8Array.from(arr)));
		return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/[=]+/g, ""); // urlBase64
	},
	decompress(s: string): string {
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

const dropdown: {
	current: unknown;
	skipped: boolean;
} = {
	current: undefined,
	skipped: false,
};
