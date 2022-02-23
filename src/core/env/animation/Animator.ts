
//=================================================================
/**
 * {@link Animator} 類別負責控制 {@link requestAnimationFrame} 的呼叫，
 * 並且定時清除呼叫堆疊以利偵錯。
 *
 * 請注意這個類別本身並沒有假定 action 參數的同步性，
 * 所以如果需要在非同步 action 的情境中避免重複執行，
 * 需要另外實作判別。
 */
//=================================================================

export class Animator {

	private static readonly _CANCEL = 300;

	private readonly _action: Action;
	private readonly _run: (time: number) => void;
	private readonly _throttle: number;
	private _request: number;
	private _last: number = performance.now();
	private _active: boolean;
	private _interval: number;

	constructor(action: Action, throttle: number, startNow: boolean = true) {
		this._action = action;
		this._throttle = throttle;
		this._run = (time: number) => {
			if(time - this._last >= this._throttle) {
				this._action();
				this._last = time;
			}
			this._next();
		};
		this.$active = startNow;
	}

	public get $active(): boolean { return this._active; }
	public set $active(active: boolean) {
		if(active == this._active) return;
		this._active = active;
		if(active) {
			this._next();
			this._interval = window.setInterval(() => {
				cancelAnimationFrame(this._request);
				this._next();
			}, Animator._CANCEL);
		} else {
			clearInterval(this._interval);
		}
	}

	private _next(): void {
		if(this._active) this._request = requestAnimationFrame(this._run);
	}
}
