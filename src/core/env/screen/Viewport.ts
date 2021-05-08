
//////////////////////////////////////////////////////////////////
/**
 * `Viewport` 物件負責管理顯示區域的大小
 */
//////////////////////////////////////////////////////////////////

abstract class Viewport {

	@shrewd protected _viewWidth: number;
	@shrewd protected _viewHeight: number;

	protected readonly _studio: Studio;
	protected readonly _el: HTMLElement;

	/** 暫時鎖定顯示區域大小 */
	private _lockViewport: boolean = false;

	constructor(studio: Studio) {
		this._studio = studio;
		this._el = studio.$el;

		window.addEventListener("resize", this._setSize.bind(this));
		this._setSize();

		// 重新刷新頁面的時候在手機版上可能會有一瞬間大小判斷錯誤，
		// 所以在建構的時候額外再多判斷一次
		setTimeout(() => this._setSize(), 10);

		// 設置事件，在手機版鍵盤開啟時暫時鎖定
		let isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
		document.addEventListener("focusin", e => {
			if(
				isTouch &&
				(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
			) {
				this._lockViewport = true;
			}
		});
		document.addEventListener("focusout", e => this._lockViewport = false);
	}

	/** 視窗大小有變動的時候重設 canvas 大小 */
	private _setSize() {
		if(this._lockViewport) return;
		this._viewWidth = this._el.clientWidth;
		this._viewHeight = this._el.clientHeight;
	}

	/** 根據自身狀態來幫助設定 paper project 的大小 */
	protected _setupViewport(size: paper.Size) {
		let [w, h] = [this._viewWidth, this._viewHeight];
		if(this._lockViewport) size.set(w, h);
		else size.set(this._el.clientWidth, this._el.clientHeight);
	}
}
