
//////////////////////////////////////////////////////////////////
/**
 * `KeyboardController` 類別負責追蹤鍵盤的按鍵狀態。
 */
//////////////////////////////////////////////////////////////////

namespace KeyboardController {

	let _states: Record<string, boolean> = {};

	export function set(e: KeyboardEvent, on: boolean) {
		_states[e.code.toLowerCase()] = on;
		_states[e.key.toLowerCase()] = on;
	}

	export function isPressed(key: string) {
		return !!_states[key];
	}

	document.body.addEventListener('keydown', e => set(e, true));
	document.body.addEventListener('keyup', e => set(e, false));
	window.addEventListener('blur', () => _states = {});
}
