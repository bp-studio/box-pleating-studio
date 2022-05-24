/* eslint-disable max-classes-per-file */

//=================================================================
/**
 * {@link Disposable} 是所有具有「棄置」這種概念的基底類別。
 */
//=================================================================
export abstract class Disposable extends EventTarget {

	private _disposed: boolean = false;

	protected get $disposed(): boolean {
		return this._disposed;
	}

	/**
	 * 執行棄置的動作。
	 */
	public $dispose(): void {
		if(this._disposed) return;
		this.dispatchEvent(new DisposeEvent());

		// 解除掉所有參照
		// 這一段要等到所有棄置動作都完成後才做，不然一堆參照會有問題
		const self = this as Record<string, unknown>;
		const keys = Object.keys(this);
		for(const key of keys) {
			if(typeof self[key] == "object") delete self[key];
		}

		this._disposed = true;
	}

	/**
	 * 提供快捷的方法註冊棄置的行為。
	 * 因為棄置只會被行一次，所以註冊的事件全部都會加上 once。
	 */
	protected _onDispose(action: Consumer<DisposeEvent>): void {
		this.addEventListener(DISPOSE, action, { once: true });
	}
}

export interface Disposable extends EventTarget {
	addEventListener<T extends keyof DisposableEventMap>(
		type: T,
		callback: Consumer<DisposableEventMap[T]>,
		options?: boolean | AddEventListenerOptions): void;
}

const DISPOSE = "dispose";

export interface DisposableEventMap {
	[DISPOSE]: DisposeEvent;
}

class DisposeEvent extends Event {
	constructor() { super(DISPOSE); }
}

export default Disposable;
