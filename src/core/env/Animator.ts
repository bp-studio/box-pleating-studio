
//////////////////////////////////////////////////////////////////
/**
 * `Animator` 類別負責控制 `requestAnimationFrame` 的呼叫，
 * 並且定時清除呼叫堆疊以利偵錯。
 *
 * 請注意這個類別本身並沒有假定 action 參數的同步性，
 * 所以如果需要在非同步 action 的情境中避免重複執行，
 * 需要另外實作判別。
 */
//////////////////////////////////////////////////////////////////

class Animator {

	private static readonly _CANCEL = 300;

	private readonly _action: Action;
	private readonly _run: (time: number) => void;
	private readonly _throttle: number;
	private _request: number;
	private _last: number = performance.now();

	constructor(action: Action, throttle: number = 0) {
		this._action = action;
		this._throttle = throttle;
		this._run = (time: number) => {
			if(time - this._last >= this._throttle) {
				this._action();
				this._last = time;
			}
			this._next();
		};
		this._next();
		setInterval(() => {
			cancelAnimationFrame(this._request);
			this._next();
		}, Animator._CANCEL);
	}

	private _next(): void {
		this._request = requestAnimationFrame(this._run);
	}
}
