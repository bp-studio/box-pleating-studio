
//=================================================================
/**
 * {@link LongPressController} 類別負責管理觸控長壓的行為。
 */
//=================================================================

export class LongPressController {

	private static readonly _TIMEOUT = 750;
	private _callback: Action;

	private _timeout?: number;

	constructor(callback: Action) {
		this._callback = callback;
		let handler = this.$cancel.bind(this);
		document.addEventListener("mouseup", handler, { passive: true });
		document.addEventListener("touchend", handler, { passive: true });
	}

	/** 長壓設置 */
	public $init(): void {
		this._timeout = window.setTimeout(this._callback, LongPressController._TIMEOUT);
	}

	/** 取消長壓；這個除了會在滑鼠或觸控放開時自動執行之外也可以手動呼叫 */
	public $cancel(): void {
		if(this._timeout !== undefined) window.clearTimeout(this._timeout);
		this._timeout = undefined;
	}
}
