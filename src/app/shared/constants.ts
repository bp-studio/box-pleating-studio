
/**
 * If native File Access API is supported.
 *
 * So far only desktop Chromium browsers have better support. Safari 15.2+ has support for private file system.
 * https://caniuse.com/native-filesystem-api
 */
export const isFileApiEnabled = typeof window.showSaveFilePicker != "undefined";

/**
 * Whether the current device is a touch-only device.
 *
 * Strictly speaking, this value is not a constant (when the debug console is enabled,
 * this value can be changed by switching emulation devices), but in practice it should be a constant.
 */
export const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;

/**
 * Determine whether the current environment is a desktop version of Mac.
 * Used for displaying Mac-style keyboard symbols.
 *
 * See https://stackoverflow.com/questions/10527983/ for the method used here.
 * Even MDN is good with this method: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform
 */
export const isMac = navigator.platform?.toLowerCase().startsWith("mac");
if(isMac) document.body.classList.add("mac");

/** If the current execution is under SSG. */
export const isSSG = navigator.userAgent.includes("jsdom");

/** Store the original page title (this will vary from build to build) */
export const defaultTitle = document.title;

/** Whether Clipboard API is supported (Safari supports in only since 13.1) */
// eslint-disable-next-line compat/compat
export const copyEnabled = "clipboard" in navigator && "write" in navigator.clipboard;

/** Whether the current instance is running online. */
export const isHttps = location.protocol === "https:";

/** Whether the current page is reloaded. */
export const isReload =
	(performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type == "reload" ??
	performance.navigation.type == 1;

export const isInApp = navigator.userAgent.match(/\bFBAV\b/);

/**
* A lucky guess that we are probably in China.
* If we are, replace the flag to avoid unnecessary trouble.
*
* For the list of timeZone to country, see:
* https://github.com/moment/moment-timezone/blob/develop/data/meta/latest.json
*/
const detectChinaLanguage = ["zh-CN", "zh-CHS", "zh-Hans", "zh-HK", "zh-MO"];
const detectChinaTimeZone = ["Asia/Shanghai", "Asia/Urumqi"];
const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
const isChina =
	detectChinaTimeZone.includes(timeZone) ||
	detectChinaLanguage.includes(navigator.language) ||
	navigator.languages.some(l => detectChinaLanguage.includes(l));
if(isChina) locale["zh-tw"].emoji = () => "🇭🇰";
