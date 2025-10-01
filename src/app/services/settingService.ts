import { reactive, watch } from "vue";

import dialogs from "./dialogService";
import Language from "./languageService";
import { deepCopy } from "shared/utils/copy";
import { clone } from "shared/utils/clone";

import type { CPOptions } from "client/plugins/cp";
import type { OptimizerOptions } from "client/plugins/optimizer";
import type { KeyStore } from "./customHotkeyService";

const KEY = "settings";

type Theme = "system" | "dark" | "light";

const DEFAULT_COLOR = undefined as number | undefined;

const DEFAULT_HOTKEY: KeyStore = {
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

/**
 * In v0.7 we made some refactoring on the data schema,
 * which will result in some settings reset to default value for some users.
 * But this is a one-time change so please bear with me.
 */
const defaultSettings = {
	autoSave: true,
	useFileSystem: true,
	loadSessionOnQueue: false,
	showDPad: true,
	showStatus: true,
	theme: "system" as Theme,
	hotkey: DEFAULT_HOTKEY,
	display: {
		axialParallel: true,
		grid: true,
		hinge: true,
		ridge: true,
		label: true,
		dot: true,
	},
	colorScheme: {
		border: DEFAULT_COLOR,
		grid: DEFAULT_COLOR,
		hinge: DEFAULT_COLOR,
		ridge: DEFAULT_COLOR,
		edge: DEFAULT_COLOR,
		junction: DEFAULT_COLOR,
		dot: DEFAULT_COLOR,
		label: DEFAULT_COLOR,
		axialParallel: DEFAULT_COLOR,
	},
	tools: {
		Optimizer: {
			layout: "view",
			openNew: true,
			useDimension: true,
			useBH: false,
			random: 1,
		} as OptimizerOptions,
		CP: {
			format: "cp",
			reorient: false,
			useAuxiliary: true,
		} as CPOptions,
		SVG: {
			includeHiddenElement: false,
		},
	},
};

const settings = reactive(clone(defaultSettings));

function loadSettings(settingString: string | null): void {
	if(!settingString) return;
	try {
		const savedSettings = JSON.parse(settingString);
		// Use deepCopy to read saved settings,
		// so that old setting will not be overwritten as we add more settings in the future.
		deepCopy(settings, savedSettings);
	} catch {
		// Simply ignore if anything went wrong
	}
}

/**
 * Whether we are synchronizing settings.
 * If that is the case, we don't write the settings to local storage again.
 */
let syncing: boolean = false;

/** Whether there was saved settings before the current instance launched. */
let hadSettings: boolean = false;

export function init(): void {
	// This event only fires when other instances make the writing
	window.addEventListener("storage", e => {
		if(e.storageArea === localStorage && e.key === KEY) {
			syncing = true;
			loadSettings(e.newValue); // triggers watcher
		}
	});

	const savedSettings = localStorage.getItem(KEY);
	hadSettings = savedSettings !== null;
	loadSettings(savedSettings);

	watch(settings, save, { deep: true, immediate: true });
	watch(
		() => settings.showStatus,
		s => document.body.classList.toggle("show-status", s),
		{ immediate: true }
	);
}

/**
 * Return the value of {@link hadSettings}.
 * We use this to decide whether we should process file handles.
 */
export function getHadSettings(): boolean {
	return hadSettings;
}

/** Save settings, unless {@link syncing}. */
function save(): void {
	if(!syncing) localStorage.setItem(KEY, JSON.stringify(settings));
	syncing = false;
}

/** Reset to default settings */
export async function reset(): Promise<void> {
	if(!await dialogs.confirm(i18n.t("preference.confirmReset"))) return;
	gtag("event", "settings_reset");
	Object.assign(settings, clone(defaultSettings));
	Language.reset();
}

export default settings;
