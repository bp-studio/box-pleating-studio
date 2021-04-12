
//////////////////////////////////////////////////////////////////
/**
 * `LongPressController` 類別負責管理觸控長壓的行為。
 */
//////////////////////////////////////////////////////////////////

class LongPressController {

	private _callback: Action;

	private _timeout?: number;

	constructor(callback: Action) {
		this._callback = callback;
		let handler = this.$cancel.bind(this);
		document.addEventListener("mouseup", handler);
		document.addEventListener("touchend", handler);
	}

	public $init() {
		this._timeout = window.setTimeout(this._callback, 750);
	}

	public $cancel() {
		if(this._timeout !== undefined) window.clearTimeout(this._timeout);
		this._timeout = undefined;
	}
}
