
class Animator {

	private _action: Action;
	private _throttle: number;
	private _request: number;
	private _last: number = performance.now();
	private _run: (time: number) => void;

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
		}, 300);
	}

	private _next() {
		this._request = requestAnimationFrame(this._run);
	}
}
