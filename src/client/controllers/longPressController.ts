import { options } from "client/options";

const TIMEOUT = 750;

//=================================================================
/**
 * {@link LongPressController} manages the long press behavior on touch devices.
 */
//=================================================================

export namespace LongPressController {

	let _timeout: number | undefined;

	export let $triggered: boolean = false;

	/** Setup long press. */
	export function $init(): void {
		$triggered = false;
		const callback = options.onLongPress;
		if(!callback) return;
		_timeout = setTimeout(() => {
			$triggered = true;
			callback();
		}, TIMEOUT);
	}

	/** Cancel long press. */
	export function $cancel(): void {
		if(_timeout !== undefined) clearTimeout(_timeout);
		_timeout = undefined;
	}
}
