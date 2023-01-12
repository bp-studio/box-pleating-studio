
//=================================================================
/**
 * {@link KeyboardController} 類別負責追蹤鍵盤的按鍵狀態。
 */
//=================================================================

export namespace KeyboardController {

	let _states: Record<string, boolean> = {};

	window.addEventListener("blur", () => _states = {});

	export function $set(e: KeyboardEvent, on: boolean): void {
		_states[e.code.toLowerCase()] = on;
		_states[e.key.toLowerCase()] = on;
	}

	export function $isPressed(key: string): boolean {
		return Boolean(_states[key]);
	}
}
