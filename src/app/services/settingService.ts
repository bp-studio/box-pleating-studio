import { reactive, watch } from "vue";

import dialogs from "./dialogService";
import Language from "./languageService";

import type { KeyStore } from "./customHotkeyService";

type Theme = "system" | "dark" | "light";

// 這邊採用 Record 的話會發生循環參照，所以只好寫開來
type Store = { [key: string]: string | Store };

const defaultSettings = {
	autoSave: true,
	showDPad: true,
	theme: "system" as Theme,
	loadSessionOnQueue: false,
	hotkey: defaultHotkey(),
	showAxialParallel: true,
	showGrid: true,
	showHinge: true,
	showRidge: true,
	showLabel: true,
	showDot: true,
	colorScheme: {
		border: undefined as number | undefined,
		grid: undefined as number | undefined,
		hinge: undefined as number | undefined,
		ridge: undefined as number | undefined,
		edge: undefined as number | undefined,
		axialParallel: undefined as number | undefined,
	},
	includeHiddenElement: false,
};

function defaultHotkey(): KeyStore {
	return {
		v: {
			t: "1",
			l: "2",
			zi: "X",
			zo: "Z",
		},
		m: {
			u: "W",
			d: "S",
			l: "A",
			r: "D",
		},
		d: {
			ri: "E",
			rd: "Q",
			hi: "sW",
			hd: "sS",
			wi: "sD",
			wd: "sA",
		},
		n: {
			d: "\t",
			cn: "T",
			cp: "R",
			pn: "G",
			pp: "F",
		},
	};
}

const settings = reactive(Object.assign({}, defaultSettings));

const settingString = localStorage.getItem("settings");
if(settingString) {
	const savedSettings = JSON.parse(settingString);

	for(const key in settings) {
		if(key == "hotkey") continue;
		// @ts-ignore
		if(savedSettings[key] !== undefined) settings[key] = savedSettings[key];
	}

	// 採用 deepCopy 讀取快速鍵設定，以免未來增加新的設定值時被舊設定覆寫掉
	if(savedSettings.hotkey !== undefined) copy(settings.hotkey, savedSettings.hotkey);
} else {
	// 儲存初始設定
	save();
}

export const hadSettings = settingString !== null;

watch(settings, save, { deep: true });

/** 把 source 物件中的屬性遞迴地複製到 target 中（忽略任一者沒有的屬性） */
function copy(target: Store, source: Store): void {
	if(!source) return;
	for(const key in target) {
		const value = target[key];
		if(value instanceof Object) copy(value, source[key] as Store);
		else if(key in source) target[key] = source[key];
	}
}

/** 儲存設定值 */
function save(): void {
	localStorage.setItem("settings", JSON.stringify(settings));
}

/** 重設設定值回到預設值 */
export async function reset(): Promise<void> {
	if(!await dialogs.confirm(i18n.t("preference.confirmReset"))) return;
	Object.assign(settings, JSON.parse(JSON.stringify(defaultSettings)));
	save();
	Language.reset();
}

export default settings;
