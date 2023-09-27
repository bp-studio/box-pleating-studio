
const handlerMap = new Map<Consumer<KeyboardEvent>, Consumer<KeyboardEvent>>();

namespace HotkeyService {

	type HotkeyEntry = [Action, string, boolean, boolean];
	const hotkeys: HotkeyEntry[] = [];

	/**
	 * Register a global hotkey.
	 *
	 * @param key Case-insensitive. For the full list of keys, see
	 * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
	 * @param ctrl Default value is `true`.
	 * @param shift Default value is `false`.
	 */
	export function register(action: Action, key: string, ctrl: boolean = true, shift: boolean = false): void {
		hotkeys.push([action, key.toLowerCase(), ctrl, shift]);
	}

	function wrapHandler(handler: Consumer<KeyboardEvent>): Consumer<KeyboardEvent> {
		return e => {
			// Capturing exceptions
			const active = document.activeElement;
			const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
			const isSave = e.key.toLowerCase() == "s" && (e.metaKey || e.ctrlKey);
			if(isInput && !isSave) return;

			handler(e);
		};
	}

	export function registerCore(handler: Consumer<KeyboardEvent>): void {
		const wrapped = wrapHandler(handler);
		handlerMap.set(handler, wrapped);
		document.body.addEventListener("keydown", wrapped);
	}

	export function unregisterCore(handler: Consumer<KeyboardEvent>): void {
		const wrapped = handlerMap.get(handler);
		if(!wrapped) return;
		document.body.removeEventListener("keydown", wrapped);
		handlerMap.delete(handler);
	}

	export function init(): void {
		registerCore(e => {
			// Skip processing hotkeys when there's opened dialogs
			if(document.querySelector(".modal-open")) return;

			for(const [action, key, ctrl, shift] of hotkeys) {
				if(e.key.toLowerCase() == key && (e.metaKey || e.ctrlKey) == ctrl && e.shiftKey == shift) {
					e.preventDefault();
					action();
					return;
				}
			}
		});
	}
}

export default HotkeyService;
