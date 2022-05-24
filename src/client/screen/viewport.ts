import { readonly, shallowRef } from "vue";

const RETRY = 10;

//=================================================================
/**
 * 提供指定的 Viewport 元件的反應式大小（無視手機上的鍵盤開啟影響）
 */
//=================================================================
export function useViewport(el: HTMLElement): Readonly<IDimension> {

	const width = shallowRef<number>(0);
	const height = shallowRef<number>(0);

	/** 是否要暫時鎖定住 Viewport 的大小 */
	let lockViewport: boolean = false;

	function update(): void {
		if(lockViewport) return;
		width.value = el.clientWidth;
		height.value = el.clientHeight;
	}

	window.addEventListener("resize", update);
	update();

	// 重新刷新頁面的時候在手機版上可能會有一瞬間大小判斷錯誤，
	// 所以在建構的時候額外再多判斷一次
	setTimeout(update, RETRY);

	// 設置事件，在手機版鍵盤開啟時暫時鎖定
	// 這邊設置的依據是根據裝置是否為純觸控裝置。當然非純觸控裝置也是有可能有虛擬鍵盤，但是暫且先不考慮那麼多。
	if(app.isTouch) {
		document.addEventListener("focusin", e => {
			const t = e.target;
			if(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
				lockViewport = true;
			}
		});
		document.addEventListener("focusout", () => lockViewport = false);
	}

	return readonly({ width, height });
}
