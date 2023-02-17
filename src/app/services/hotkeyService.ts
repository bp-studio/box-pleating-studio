
namespace HotkeyService {

	type HotkeyEntry = [Action, string, boolean];
	const hotkeys: HotkeyEntry[] = [];

	export function register(action: Action, key: string, shift?: boolean): void {
		hotkeys.push([action, key.toLowerCase(), Boolean(shift)]);
	}

	export function registerCore(handler: Consumer<KeyboardEvent>): EventListener {
		document.body.addEventListener("keydown", handler);
		return handler as EventListener;
	}

	export function unregisterCore(handler: Consumer<KeyboardEvent>): void {
		document.body.removeEventListener("keydown", handler);
	}

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

		if(e.metaKey || e.ctrlKey || e.key == "Escape") {
			e.preventDefault();
			for(const [action, key, shift] of hotkeys) {
				if(e.key.toLowerCase() == key && e.shiftKey == shift) {
					action();
					return;
				}
			}
		}
	});
}

export default HotkeyService;
