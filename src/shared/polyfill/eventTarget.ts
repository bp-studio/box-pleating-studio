// For Safari < 14

import "./globalThis";

type Listener = EventListenerOrEventListenerObject;

//=================================================================
/**
 * Polyfill for the {@link EventTarget} constructor (so that it can be extended).
 * https://caniuse.com/mdn-api_eventtarget_eventtarget
 *
 * The idea is simply to wrap around a native {@link EventTarget}, such as an {@link HTMLElement}.
 * This way we directly have the all the details currently implemented.
 */
//=================================================================
class EventTargetPolyfill {

	private _div: HTMLDivElement = document.createElement("div");

	public addEventListener(type: string, listener: Listener, options?: AddEventListenerOptions | boolean): void {
		this._div.addEventListener(type, listener, options);
	}

	public removeEventListener(type: string, listener: Listener, options?: EventListenerOptions | boolean): void {
		this._div.removeEventListener(type, listener, options);
	}

	public dispatchEvent(event: Event): boolean {
		return this._div.dispatchEvent(event);
	}
}

interface EventTargetPolyfill extends EventTarget { }

try {
	new EventTarget();
} catch {
	// If `EventTarget` is undefined or is not a constructor, use polyfill
	/* istanbul ignore next */
	globalThis.EventTarget = EventTargetPolyfill;
}

export { };
