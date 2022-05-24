
/**
 * 用來區分在瀏覽器裡面多重開啟頁籤的不同實體；
 * 理論上不可能同時打開，所以用時間戳記就夠了。
 */
export const id: number = new Date().getTime();

if("serviceWorker" in navigator) {
	// 有別的 BP Studio 實體過來詢問 id 的時候回答之（判斷存檔權時使用）
	navigator.serviceWorker.addEventListener("message", event => {
		if(event.data == "id") event.ports[0].postMessage(id);
	});
}
