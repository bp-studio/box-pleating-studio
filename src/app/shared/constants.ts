
/**
 * 是否支援原生檔案 API。
 *
 * 目前為止只有桌機版的 Chromium 類瀏覽器有較完整的支援。Safari 15.2+ 開始支援私有檔案系統。
 * https://caniuse.com/native-filesystem-api
 */
export const isFileApiEnabled = typeof window.showSaveFilePicker != "undefined";

/**
 * 是否目前的裝置為純觸控裝置。
 *
 * 嚴格來說，這個值其實並非常數（在開啟偵錯主控台的時候，這個值可以因為切換模擬裝置而改變），
 * 但是在實務上它應該要是一個常數沒錯。
 */
export const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;

/**
 * 判斷是否當前的環境為桌機版的 Mac。
 *
 * 這邊採用的判別方法參見 https://stackoverflow.com/questions/10527983/
 */
export const isMac = navigator.platform?.toLowerCase().startsWith("mac");
if(isMac) document.body.classList.add("mac");

/** 儲存原始的頁面標題（這會隨著建置版本而有差異） */
export const defaultTitle = document.title;

/** 是否支援 Clipboard API（Safari 13.1 才開始支援） */
// eslint-disable-next-line compat/compat
export const copyEnabled = "clipboard" in navigator && "write" in navigator.clipboard;
