import { StudioBase } from "./StudioBase";
import { Display } from "./screen";
import { Updater } from "./animation/Updater";
import { System } from "./System";
import { HistoryService } from "bp/content/changes";
import { Migration } from "bp/content/patches";
import { ViewService } from "bp/env/service";
import type { StudioOptions } from "./StudioOptions";
import type { Design } from "bp/design";
import type { JDesign } from "bp/content/json";

//=================================================================
/**
 * {@link Studio} 類別是程式的真正起點，是內部的最上層類別。
 * 它同時負責管理專案的開啟、關閉以及輸出。
 */
//=================================================================

@shrewd export class Studio extends StudioBase {

	public readonly $system: System;
	public readonly $designMap: Map<number, Design> = new Map();
	public readonly $el: HTMLElement;
	public readonly $display: Display;
	public readonly $option: StudioOptions;
	public readonly $updater: Updater;

	constructor(selector: string) {
		super();
		let el = document.querySelector(selector);
		if(el == null || !(el instanceof HTMLElement)) {
			throw new Error("selector is not valid");
		}

		// 這幾列有順序關係
		this.$option = {};
		this.$el = el;
		this.$display = new Display(this);
		this.$system = new System(this);
		this.$updater = new Updater(this);

		Migration.$onDeprecate = (title?: string) => this.$option.onDeprecate?.(title);
		ViewService.$initialize();
		HistoryService.$initialize();
	}

	public $createBpsBlob(id?: number): Blob | null {
		let design = id === undefined ? this.$design : this.$designMap.get(id);
		if(!design) return null;
		let bps = JSON.stringify(design);
		return new Blob([bps], { type: "application/bpstudio.project+json" });
	}

	protected _tryLoad(design: RecursivePartial<JDesign>): Design {
		let result = super._tryLoad(design);

		// 這邊順便直接更新，不然載入大專案的時候會跟 tab 之間有一點時間差
		this.$updater.$update();

		return result;
	}

	protected _designFactory(design: RecursivePartial<JDesign>): Design {
		let result = super._designFactory(design);
		result.$LayoutSheet.onZoom = result.$TreeSheet.onZoom = (zoom: number) => this.$display.$zoom(zoom);
		this.$updater.$active = true;
		return result;
	}
}
