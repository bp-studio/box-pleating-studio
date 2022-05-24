
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
			// 設置攔截例外
			const k = e.key.toLowerCase();
			if((k == "s" || k == "o" || k == "p") && (e.metaKey || e.ctrlKey)) return;

			// 如果正在使用輸入框，把一切的正常事件監聽都阻斷掉
			const active = document.activeElement;
			if(active instanceof HTMLInputElement && !active.classList.contains("key") || active instanceof HTMLTextAreaElement) {
				e.stopImmediatePropagation();
			}
		},
		{ capture: true }
	);

	registerCore(e => {
		// 有對話方塊打開的話一律不處理通常的快速鍵
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
