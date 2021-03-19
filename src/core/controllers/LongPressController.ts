
//////////////////////////////////////////////////////////////////
/**
 * `LongPressController` 類別負責管理觸控長壓的行為。
 */
//////////////////////////////////////////////////////////////////

class LongPressController {

	private _callback: Action;

	private _timeout: number;

	constructor(callback: Action) {
		this._callback = callback;

		document.addEventListener("mouseup", this.cancel.bind(this));
	}

	public init() {
		this._timeout = window.setTimeout(this._callback, 750);
	}

	public cancel() {
		window.clearTimeout(this._timeout);
	}
}
