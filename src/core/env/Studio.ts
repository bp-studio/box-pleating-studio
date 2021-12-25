import { StudioBase } from "./StudioBase";
import { Display } from "./screen";
import { System } from "./System";
import { Updater } from "./animation/Updater";
import { HistoryManager } from "bp/content/changes";
import { ViewManager } from "bp/view/ViewManager";
import type { Design } from "bp/design";
import type { JDesign } from "bp/content/json";
import type { TitleCallback } from "./StudioBase";

export interface StudioOptions {
	onDeprecate?: TitleCallback;
	onUpdate?: Action<void | Promise<void>>;
	onDrag?: Action;
	onLongPress?: Action;
}

//////////////////////////////////////////////////////////////////
/**
 * {@link Studio} 類別是程式的真正起點，是內部的最上層類別。
 * 它同時負責管理專案的開啟、關閉以及輸出。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class Studio extends StudioBase {

	public readonly $system: System;
	public readonly $designMap: Map<number, Design> = new Map();
	public readonly $display: Display;
	public readonly $viewManager = new ViewManager();
	public readonly $el: HTMLElement;
	public readonly $paper: paper.PaperScope;
	public readonly $option: StudioOptions;
	public readonly $updater: Updater;

	constructor(selector: string) {
		super();
		let el = document.querySelector(selector);
		if(el == null || !(el instanceof HTMLElement)) {
			throw new Error("selector is not valid");
		}

		this.$option = {};
		this.$el = el;
		this.$paper = new paper.PaperScope();
		this.$display = new Display(this);
		this.$system = new System(this);
		this.$updater = new Updater(this);

		this._onDesignCreated = () => this.$updater.$active = true;
	}

	public $historyManagerFactory(design: Design, data: JDesign): HistoryManager {
		return new HistoryManager(design, data.history);
	}

	public onDeprecate(title?: string): void { this.$option.onDeprecate?.(title); }

	public $createBpsBlob(): Blob | null {
		if(!this.$design) return null;
		let json = this.$design.toJSON();
		delete json.history; // 存檔的時候不用儲存歷史
		let bps = JSON.stringify(json);
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
		return result;
	}
}
