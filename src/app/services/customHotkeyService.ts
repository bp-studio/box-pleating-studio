import { isMac } from "app/shared/constants";
import { zoomStep } from "app/utils/viewUtility";
import Settings from "./settingService";
import Studio from "./studioService";

import type { DirectionKey } from "shared/types/types";

export interface KeyStore {
	[name: string]: {
		[command: string]: string;
	};
}

//=================================================================
/**
 * {@link CustomHotkeyService} is responsible for managing hotkeys that can be customized
 */
//=================================================================
namespace CustomHotkeyService {

	export function formatKey(key: string): string {
		if(key == "\t") return isMac ? "⇥" : "Tab";
		return key.replace(/^s/, isMac ? "⇧" : "Shift + ");
	}

	export function toKey(e: KeyboardEvent): string | null {
		let key = e.key.toUpperCase();
		if(key == "TAB") key = "\t";
		if(key.length > 1 || key == " ") return null;
		if(key.match(/^[A-Z]$/) && e.shiftKey) key = "s" + key;
		return key;
	}

	export function findKey(key: string | null): string | null {
		if(!key) return null;
		for(const name in Settings.hotkey) {
			for(const command in Settings.hotkey[name]) {
				if(Settings.hotkey[name][command] == key) {
					return name + "." + command;
				}
			}
		}
		return null;
	}

	document.body.addEventListener("keydown", e => onKey(e), { capture: true });

	function onKey(e: KeyboardEvent): void {
		// Condition for ignoring
		if(document.querySelector(".modal-open") || e.metaKey || e.ctrlKey) return;

		const find = findKey(toKey(e));
		if(!find || !Studio.project) return;

		// Prevent triggering the native behavior of the Tab key
		e.preventDefault();

		const [name, command] = find.split(".");
		if(name == "m") handleMoveCommand(command);
		else if(name == "v") handleViewCommand(command);
		else if(name == "n") handleNavigationCommand(command);
		else handleDimensionCommand(command);
	}

	/** Processing control movement */
	function handleMoveCommand(command: string): void {
		const map: Record<string, DirectionKey> = {
			u: "up",
			d: "down",
			l: "left",
			r: "right",
		};
		Studio.dragByKey(map[command]);
	}

	/** Processing component navigation */
	function handleNavigationCommand(command: string): void {
		if(!Studio.project) return;
		if(command == "d") return Studio.project.design.goToDual();

		const stretch = Studio.stretch;
		if(!stretch) return;
		const f = command.endsWith("n") ? 1 : -1;
		if(command.startsWith("c")) stretch.moveConfig(f);
		else stretch.movePattern(f);
	}

	/** Processing toggling and zooming of views */
	function handleViewCommand(command: string): void {
		if(!Studio.project) return;
		const design = Studio.project.design;
		if(command.startsWith("z")) {
			const sheet = design.sheet;
			const step = zoomStep(sheet.zoom);
			sheet.zoom += step * (command == "zi" ? 1 : -1);
		} else {
			design.mode = command == "t" ? "tree" : "layout";
		}
	}

	/** Processing size changes of components */
	function handleDimensionCommand(command: string): void {
		if(!Studio.project) return;
		const f = command.endsWith("i") ? 1 : -1;
		const sel = Studio.selections.length ? Studio.selections : [Studio.project.design.sheet.grid];
		for(const target of sel) {
			if(command.startsWith("w")) {
				tryChange(target, f, "width", "size");
			} else if(command.startsWith("h")) {
				tryChange(target, f, "height", "size");
			} else {
				tryChange(target, f, "radius", "length");
			}
		}
	}

	function tryChange(target: object, value: number, ...keys: string[]): void {
		for(const key of keys) {
			const pseudo = target as Record<string, number>;
			if(typeof pseudo[key] == "number") {
				pseudo[key] += value;
				return;
			}
		}
	}
}

export function hk(name: string, command: string, p: boolean = false): string {
	try {
		const key = Settings.hotkey[name][command];
		if(!key) return "";
		return (p ? " (" : "") + i18n.t("preference.hotkey") + " " + CustomHotkeyService.formatKey(key) + (p ? ")" : "");
	} catch(e) {
		return "";
	}
}

export default CustomHotkeyService;
