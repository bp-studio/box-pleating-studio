
//=================================================================
/**
 * {@link KeyboardController} 類別負責追蹤鍵盤的按鍵狀態。
 */
//=================================================================

export namespace KeyboardController {

	let _states: Record<string, boolean> = {};

	function _set(e: KeyboardEvent, on: boolean): void {
		_states[e.code.toLowerCase()] = on;
		_states[e.key.toLowerCase()] = on;
	}

	export function $isPressed(key: string): boolean {
		return Boolean(_states[key]);
	}

	export function $init(): void {
		document.body.addEventListener('keydown', e => _set(e, true));
		document.body.addEventListener('keyup', e => _set(e, false));
		window.addEventListener('blur', () => _states = {});
	}
}
