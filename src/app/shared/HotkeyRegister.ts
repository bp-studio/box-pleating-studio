///////////////////////////////////////////////////
// 快捷鍵註冊
///////////////////////////////////////////////////

type Hotkey = [Action, string, boolean];
interface KeyStore {
	[name: string]: {
		[command: string]: string;
	};
}

const hotkeys: Hotkey[] = [];

function defaultHotkey(): KeyStore {
	return {
		v: {
			t: '1',
			l: '2',
			zi: 'X',
			zo: 'Z',
		},
		m: {
			u: 'W',
			d: 'S',
			l: 'A',
			r: 'D',
		},
		d: {
			ri: 'E',
			rd: 'Q',
			hi: 'sW',
			hd: 'sS',
			wi: 'sD',
			wd: 'sA',
		},
		n: {
			d: '\t',
			cn: 'T',
			cp: 'R',
			pn: 'G',
			pp: 'F',
		},
	};
}

function formatKey(key: string): string {
	if(key == '\t') return isMac ? '⇥' : 'Tab';
	return key.replace(/^s/, isMac ? '⇧' : 'Shift + ');
}

function toKey(e: KeyboardEvent): string | null {
	let key = e.key.toUpperCase();
	if(key == "TAB") key = '\t';
	if(key.length > 1 || key == ' ') return null;
	if(key.match(/^[A-Z]$/) && e.shiftKey) key = 's' + key;
	return key;
}

function findKey(key: string | null, store: KeyStore): string | null {
	if(!key) return null;
	for(let name in store) {
		for(let command in store[name]) {
			if(store[name][command] == key) {
				return name + '.' + command;
			}
		}
	}
	return null;
}

function registerHotkey(action: Action, key: string, shift?: boolean): void {
	hotkeys.push([action, key.toLowerCase(), Boolean(shift)]);
}

function registerHotkeyCore(handler: Consumer<KeyboardEvent>): EventListener {
	document.body.addEventListener("keydown", handler);
	return handler;
}

function unregisterHotkeyCore(handler: EventListener): void {
	document.body.removeEventListener("keydown", handler);
}

document.addEventListener(
	'keydown',
	e => {
		// 設置攔截例外
		let k = e.key.toLowerCase();
		if((k == "s" || k == "o" || k == "p") && (e.metaKey || e.ctrlKey)) return;

		// 如果正在使用輸入框，把一切的正常事件監聽都阻斷掉
		let active = document.activeElement;
		if(active instanceof HTMLInputElement && !active.classList.contains("key") || active instanceof HTMLTextAreaElement) {
			e.stopImmediatePropagation();
		}
	},
	{ capture: true }
);

registerHotkeyCore(e => {
	// 有對話方塊打開的話一律不處理通常的快速鍵
	if(document.querySelector('.modal-open')) return;

	if(e.metaKey || e.ctrlKey || e.key == "Escape") {
		e.preventDefault();
		for(let [action, key, shift] of hotkeys) {
			if(e.key.toLowerCase() == key && e.shiftKey == shift) {
				action();
				return;
			}
		}
	}
});
