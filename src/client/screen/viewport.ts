import { readonly, shallowRef } from "vue";

import { isTouch } from "app/shared/constants";

const RETRY = 10;

export type Viewport = Readonly<IDimension> & {
	$update(): void;
};

//=================================================================
/**
 * Provide reactive Viewport size
 * (not effected by the opening of virtual keyboard on mobiles)
 */
//=================================================================
export function useViewport(el: HTMLElement): Viewport {

	const width = shallowRef<number>(0);
	const height = shallowRef<number>(0);

	/** Should we temporarily lock the size of the Viewport */
	let lockViewport: boolean = false;

	function $update(): void {
		if(lockViewport) return;
		width.value = el.clientWidth;
		height.value = el.clientHeight;
	}

	// Initialize
	$update();

	// When reloading the page, there may be a momentary size change on mobile devices.
	// So we check the size one more time after constructing
	setTimeout($update, RETRY);

	// Setup the events to lock the Viewport on virtual keyboard.
	// This is based on whether the device is a pure touch device;
	// of course other devices may also have virtual keyboards, but let's not worry about those for now.
	if(isTouch) {
		document.addEventListener("focusin", e => {
			const t = e.target;
			if(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
				lockViewport = true;
			}
		});
		document.addEventListener("focusout", () => lockViewport = false);
	}

	return readonly({ width, height, $update });
}
