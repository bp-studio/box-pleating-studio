/* eslint-disable max-classes-per-file */

//=================================================================
/**
 * {@link Disposable} is the base class for all classes with the notion of "disposing".
 */
//=================================================================
export abstract class Disposable extends EventTarget {

	private _disposed: boolean = false;

	protected get $disposed(): boolean {
		return this._disposed;
	}

	/**
	 * Perform the action of disposing.
	 */
	public $dispose(): void {
		if(this._disposed) return;
		this.dispatchEvent(new DisposeEvent());

		// Remove all object references to improve GC.
		// We have to wait until all disposing actions are done to do this,
		// or we'll end up in a lot of trouble.
		const self = this as Record<string, unknown>;
		const keys = Object.keys(this);
		for(const key of keys) {
			if(typeof self[key] == "object") delete self[key];
		}

		this._disposed = true;
	}

	/**
	 * Provide the quick method to register disposing action.
	 * Since disposing is a one-time thing, all these event listener has "once" on them.
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
