
interface StudioOptions {
	onDeprecate?: (title?: string) => void;
	onUpdate?: Action;
	onDrag?: Action;
	onLongPress?: Action;
}

//////////////////////////////////////////////////////////////////
/**
 * `Studio` 類別是程式的真正起點，是內部的最上層類別。
 * 它同時負責管理專案的開啟、關閉以及輸出。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Studio {

	public readonly $system: System;
	public readonly $designMap: Map<number, Design> = new Map();
	public readonly $display: Display;
	public readonly $el: HTMLElement;
	public readonly $paper: paper.PaperScope;
	public readonly $option: StudioOptions;
	public readonly $updater: Updater;

	@shrewd public $design: Design | null = null;

	constructor(selector: string) {
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
	}

	public $load(json: string | object): Design {
		if(typeof json == "string") json = JSON.parse(json);
		let design = Migration.$process(json as Pseudo<JDesign>, this.$option.onDeprecate);
		return this._tryLoad(design);
	}

	public $create(json: Pseudo<JDesign>): Design {
		Object.assign(json, {
			version: Migration.$current,
			tree: {
				nodes: [
					{ id: 0, name: "", x: 10, y: 10 },
					{ id: 1, name: "", x: 10, y: 13 },
					{ id: 2, name: "", x: 10, y: 7 },
				],
				edges: [
					{ n1: 0, n2: 1, length: 1 },
					{ n1: 0, n2: 2, length: 1 },
				],
			},
		});
		return this.$restore(json);
	}

	public $restore(json: Pseudo<JDesign>): Design {
		let design = new Design(this, Migration.$process(json, this.$option.onDeprecate));
		this.$designMap.set(design.id, design);
		return design;
	}

	/** 此方法有防呆 */
	public $select(id: number | null): void {
		if(id != null) {
			let d = this.$designMap.get(id);
			if(d) this.$design = d;
		} else this.$design = null;
	}

	/** 此方法有防呆 */
	public $close(id: number): void {
		let d = this.$designMap.get(id);
		if(d) {
			this.$designMap.delete(id);
			d.$dispose();
		}
	}

	public $closeAll(): void {
		this.$design = null;
		for(let d of this.$designMap.values()) d.$dispose();
		this.$designMap.clear();
	}

	public $CreateBpsUrl(): string {
		if(!this.$design) return "";
		let json = this.$design.toJSON();
		delete json.history; // 存檔的時候不用儲存歷史
		let bps = JSON.stringify(json);
		let blob = new Blob([bps], { type: "application/octet-stream" });
		return URL.createObjectURL(blob);
	}

	private _tryLoad(design: RecursivePartial<JDesign>): Design {
		this.$design = new Design(this, design);
		this.$designMap.set(this.$design.id, this.$design);

		// 這邊順便直接更新，不然載入大專案的時候會跟 tab 之間有一點時間差
		this.$updater.$update();

		return this.$design;
	}
}
