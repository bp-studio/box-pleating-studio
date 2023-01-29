import { computed } from "vue";

import ProjectService from "client/services/projectService";
import { useViewport } from "./viewport";

import type { Viewport } from "./viewport";
import type { ScrollController } from "client/controllers/scrollController";

/**
 * 提供全域的圖像尺寸。
 *
 * 特別注意到我們在此並未設置監看這個值並且在改變的時候呼叫
 * {@link ScrollView.$updateScrollbar} 方法，
 * 這是因為如果文字標籤的計算邏輯沒有錯誤的話，除了縮放之類的情況之外，
 * 圖像尺寸理論上並不會出現除了細微誤差之外的變化。
 */
const imageDimension = computed<IDimension>(() => {
	const sheet = ProjectService.sheet.value;
	if(!sheet) return { width: 0, height: 0 };
	return sheet.$imageDimension.value;
});

//=================================================================
/**
 * {@link ScrollView} 物件負責管理捲動區域，包括捲軸是否顯示、以及捲動時的低階操作。
 * 它並不包含捲動的 UI 邏輯；這部份是 {@link ScrollController} 在處理的。
 */
//=================================================================

export class ScrollView extends EventTarget {

	public readonly $viewport: Viewport;
	private readonly _el: HTMLElement;
	private readonly _spaceHolder: HTMLDivElement = document.createElement("div");

	/** 由程式主動操作捲軸的時候暫時鎖住事件的反饋行為 */
	private _lock: boolean = false;

	constructor(el: HTMLElement) {
		super();
		this._el = el;
		this.$viewport = useViewport(el);

		el.appendChild(this._spaceHolder);
		this._spaceHolder.style.zIndex = "-10"; // 修正 iPhone 6 的問題

		// 使用者主動進行捲動
		el.addEventListener("scroll", () => {
			if(this._lock) this._lock = false;
			else this.dispatchEvent(new Event("scroll"));
		});

		// 捲動區域大小改變
		window.addEventListener("resize", () => this.$updateScrollbar());
	}

	public get $isScrollable(): boolean {
		return this._el.classList.contains("scroll-x") || this._el.classList.contains("scroll-y");
	}

	public $onScroll(handler: Consumer<IPoint>): void {
		this.addEventListener("scroll", () =>
			handler({ x: this._el.scrollLeft, y: this._el.scrollTop })
		);
	}

	/** 視情況更新捲軸的顯示與否 */
	public $updateScrollbar(): void {
		// 先更新一次 Viewport 大小，以便正確計算 image 的大小
		this.$viewport.$update();

		const image = imageDimension.value;
		this._spaceHolder.style.width = image.width + "px";
		this._spaceHolder.style.height = image.height + "px";

		// 加 2 以避免浮點數誤觸
		const scrollX = image.width > this._el.clientWidth + 2;
		const scrollY = image.height > this._el.clientHeight + 2;
		this._el.classList.toggle("scroll-x", scrollX);
		this._el.classList.toggle("scroll-y", scrollY);

		// 再檢測一次，以因應某一個捲軸因為另外一個捲軸而跑出來的情況
		this._el.classList.toggle("scroll-x", scrollX || image.width > this._el.clientWidth + 2);
		this._el.classList.toggle("scroll-y", scrollY || image.height > this._el.clientHeight + 2);

		// 捲軸變動可能會導致 Viewport 改變，此時設置延遲然後重刷一次
		setTimeout(this.$viewport.$update, 0);
	}

	/** 檢查指定的捲動座標並且完成捲動，然後傳回修正後的捲動座標 */
	public $scrollTo(x: number, y: number): IPoint {
		const image = imageDimension.value;
		const w = Math.max(image.width - this._el.clientWidth, 0);
		const h = Math.max(image.height - this._el.clientHeight, 0);
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > w) x = w;
		if(y > h) y = h;
		this._lock = true;
		this._el.scrollLeft = x;
		this._el.scrollTop = y;
		return { x, y };
	}
}
