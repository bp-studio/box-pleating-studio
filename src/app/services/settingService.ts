import { reactive, watch } from "vue";

import dialogs from "./dialogService";
import Language from "./languageService";

import type { KeyStore } from "./customHotkeyService";

type Theme = "system" | "dark" | "light";

// Self-reference will happen if we use Record here,
// so we have to write it out explicitly.
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
	showStatus: true,
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

	// Use deepCopy to read the hotkey settings,
	// so that old setting will not be overwritten as we add more settings in the future.
	if(savedSettings.hotkey !== undefined) copy(settings.hotkey, savedSettings.hotkey);
} else {
	// Save initial settings
	save();
}

export const hadSettings = settingString !== null;

watch(settings, save, { deep: true });

watch(() => settings.showStatus, s => document.body.classList.toggle("show-status", s), { immediate: true });

/**
 * Copy the properties in the source object to the target object,
 * ignoring the properties absent in either of them.
 */
function copy(target: Store, source: Store): void {
	if(!source) return;
	for(const key in target) {
		const value = target[key];
		if(value instanceof Object) copy(value, source[key] as Store);
		else if(key in source) target[key] = source[key];
	}
}

/** Save settings */
function save(): void {
	localStorage.setItem("settings", JSON.stringify(settings));
}

/** Reset to default settings */
export async function reset(): Promise<void> {
	if(!await dialogs.confirm(i18n.t("preference.confirmReset"))) return;
	Object.assign(settings, JSON.parse(JSON.stringify(defaultSettings)));
	save();
	Language.reset();
}

export default settings;
