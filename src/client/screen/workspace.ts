import { computed, watch, watchEffect } from "vue";

import ProjectService from "client/services/projectService";
import { MARGIN } from "./constants";

import type { Viewport } from "./viewport";

type Callback = (width: number, height: number) => void;

//=================================================================
/**
 * {@link Workspace} 物件負責管理工作區域，是一個可以被捲動的空間。
 */
//=================================================================

export class Workspace {

	private readonly _el: HTMLElement;
	private readonly _viewport: Viewport;
	private readonly _spaceHolder: HTMLDivElement = document.createElement("div");

	/** 由程式主動操作捲軸的時候暫時鎖住事件的反饋行為 */
	private _lock: boolean = false;

	private readonly _imageDimension = computed<IDimension>(() => {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return { width: 0, height: 0 };
		return sheet.$imageDimension.value;
	});

	constructor(el: HTMLElement, viewport: Viewport, callback: Callback) {
		this._el = el;
		this._viewport = viewport;

		el.appendChild(this._spaceHolder);
		this._spaceHolder.style.zIndex = "-10"; // 修正 iPhone 6 的問題

		// 由使用者主動捲動的時候更新試圖捲動位置
		el.addEventListener("scroll", () => {
			if(this._lock) {
				this._lock = false;
			} else {
				const sheet = ProjectService.sheet.value!;
				sheet.$scroll.x = this._el.scrollLeft;
				sheet.$scroll.y = this._el.scrollTop;
			}
		});

		// 捲動區域大小改變時進行回調
		watchEffect(() => {
			this._updateScrollbar();
			callback(el.clientWidth, el.clientHeight);
		});

		// 切換檢視的時候還原捲軸位置
		watch(ProjectService.sheet, sheet => {
			if(!sheet) return;
			this._updateScrollbar();
			this._lock = true;
			this._el.scrollTo(sheet.$scroll.x, sheet.$scroll.y);
		});
	}

	/** 根據指定的中心點進行縮放並且適度捲動以維持縮放中心不動 */
	public $zoom(zoom: number, center: Readonly<IPoint>): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		const oldScale = ProjectService.scale.value; // 舊值
		const point = {
			x: sheet.$scroll.x + center.x - sheet.$horizontalMargin,
			y: sheet.$scroll.y + center.y - MARGIN,
		};

		sheet.$zoom = zoom; // 會使得 scale 改變
		const newScale = ProjectService.scale.value; // 新值

		// 必須先進行下面這一步，否則可能根本沒有捲軸可以捲
		this._updateScrollbar();

		this._scrollTo(
			point.x * newScale / oldScale + sheet.$horizontalMargin - center.x,
			point.y * newScale / oldScale + MARGIN - center.y
		);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 視情況更新捲軸的顯示與否 */
	private _updateScrollbar(): void {
		const image = this._imageDimension.value;
		this._spaceHolder.style.width = image.width + "px";
		this._spaceHolder.style.height = image.height + "px";

		// 加 1 以避免浮點數誤觸
		const scrollX = image.width > this._el.clientWidth + 1;
		const scrollY = image.height > this._el.clientHeight + 1;
		this._el.classList.toggle("scroll-x", scrollX);
		this._el.classList.toggle("scroll-y", scrollY);

		// 再檢測一次，以因應某一個捲軸因為另外一個捲軸而跑出來的情況
		this._el.classList.toggle("scroll-x", scrollX || image.width > this._el.clientWidth + 1);
		this._el.classList.toggle("scroll-y", scrollY || image.height > this._el.clientHeight + 1);
	}

	/** 檢查指定的捲動座標並且完成捲動 */
	private _scrollTo(x: number, y: number): void {
		const image = this._imageDimension.value;
		const w = Math.max(image.width - this._viewport.width, 0);
		const h = Math.max(image.height - this._viewport.height, 0);
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > w) x = w;
		if(y > h) y = h;
		const sheet = ProjectService.sheet.value!;
		sheet.$scroll.x = x;
		sheet.$scroll.y = y;
		this._lock = true;
		this._el.scrollTo(x, y);
	}
}
