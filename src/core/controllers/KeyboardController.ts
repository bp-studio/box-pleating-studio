
//////////////////////////////////////////////////////////////////
/**
 * `KeyboardController` 類別負責追蹤鍵盤的按鍵狀態。
 */
//////////////////////////////////////////////////////////////////

class KeyboardController {

	private _states: Record<string, boolean> = {};

	private static _instance: KeyboardController;
	public static get instance() {
		return KeyboardController._instance = KeyboardController._instance || new KeyboardController();
	}

	private constructor() {
		document.body.addEventListener('keydown', e => this.set(e, true));
		document.body.addEventListener('keyup', e => this.set(e, false));
		window.addEventListener('blur', () => this._states = {});
	}

	private set(e: KeyboardEvent, on: boolean) {
		this._states[e.code.toLowerCase()] = on;
		this._states[e.key.toLowerCase()] = on;
	}

	public isPressed(key: string) {
		return !!this._states[key];
	}
}

KeyboardController.instance; // 立刻初始化 KeyboardController 的 singleton
