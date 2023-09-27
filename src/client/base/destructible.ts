/* eslint-disable max-classes-per-file */

//=================================================================
/**
 * {@link Destructible} is the base class for all classes with the
 * notion of "destructing".
 *
 * Originally called `Disposable`, but since TypeScript 5.2
 * we changed the name to avoid conflicting with the built-in
 * {@link Disposable} interface.
 */
//=================================================================
export abstract class Destructible extends EventTarget {

	private _destructed: boolean = false;

	protected get $destructed(): boolean {
		return this._destructed;
	}

	/**
	 * Perform the action of destructing.
	 */
	public $destruct(): void {
		if(this._destructed) return;
		this.dispatchEvent(new DestructEvent());

		// Remove all object references to improve GC.
		// We have to wait until all destructing actions are done to do this,
		// or we'll end up in a lot of trouble.
		for(const key of Object.keys(this)) {
			if(typeof this[key] === "object") delete this[key];
		}

		this._destructed = true;
	}

	/**
	 * Provide the quick method to register destructing action.
	 * Since destructing is a one-time thing, all these event listener has "once" on them.
	 */
	protected _onDestruct(action: Consumer<DestructEvent>): void {
		this.addEventListener(DESTRUCT, action, { once: true });
	}
}

export interface Destructible extends EventTarget {
	addEventListener<T extends keyof DestructibleEventMap>(
		type: T,
		callback: Consumer<DestructibleEventMap[T]>,
		options?: boolean | AddEventListenerOptions): void;
}

const DESTRUCT = "destruct";

export interface DestructibleEventMap {
	[DESTRUCT]: DestructEvent;
}

/** Destructing Event */
class DestructEvent extends Event {
	constructor() { super(DESTRUCT); }
}

