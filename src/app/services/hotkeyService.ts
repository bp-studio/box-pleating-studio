
namespace HotkeyService {

	type HotkeyEntry = [Action, string, boolean, boolean];
	const hotkeys: HotkeyEntry[] = [];

	/**
	 * Register a global hotkey.
	 *
	 * @param key Case-insensitive. For the full list of keys, see
	 * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
	 */
	export function register(action: Action, key: string, ctrl: boolean = true, shift: boolean = false): void {
		hotkeys.push([action, key.toLowerCase(), ctrl, shift]);
	}

	export function registerCore(handler: Consumer<KeyboardEvent>): EventListener {
		document.body.addEventListener("keydown", handler);
		return handler as EventListener;
	}

	export function unregisterCore(handler: Consumer<KeyboardEvent>): void {
		document.body.removeEventListener("keydown", handler);
	}

	export function init(): void {
		document.addEventListener(
			"keydown",
			e => {
				// Capturing exceptions
				const k = e.key.toLowerCase();
				if((k == "s" || k == "o" || k == "p") && (e.metaKey || e.ctrlKey)) return;

				// If input field is in use, block all regular event listeners.
				const active = document.activeElement;
				if(active instanceof HTMLInputElement && !active.classList.contains("key") || active instanceof HTMLTextAreaElement) {
					e.stopImmediatePropagation();
				}
			},
			{ capture: true }
		);

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
