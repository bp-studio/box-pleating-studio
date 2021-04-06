// Level 0
/// <reference path="global/import.ts" />
/// <reference path="global/Decorators.ts" />
/// <reference path="util/Decorators.ts" />
/// <reference path="pattern/Region.ts" />
/// <reference path="class/Disposable.ts" />
/// <reference path="math/PolyBool.ts" />
/// <reference path="command/Command.ts" />

// Level 1
/// <reference path="pattern/Piece.ts" />
/// <reference path="pattern/AddOn.ts" />
/// <reference path="model/DoubleMap.ts" />
/// <reference path="mapping/BaseMapping.ts" />
/// <reference path="mapping/DoubleMapping.ts" />
/// <reference path="math/Fraction.ts" />
/// <reference path="pattern/Partitioner.ts" />
/// <reference path="helper/RiverHelperBase.ts" />
/// <reference path="helper/QuadrantHelper.ts" />
/// <reference path="command/FieldCommand.ts" />
/// <reference path="command/MoveCommand.ts" />
/// <reference path="command/EditCommand.ts" />

// Level 2
/// <reference path="mapping/Mapping.ts" />
/// <reference path="mapping/GroupMapping.ts" />
/// <reference path="class/Mountable.ts" />
/// <reference path="model/Tree.ts" />
/// <reference path="math/Couple.ts" />
/// <reference path="pattern/Partition.ts" />
/// <reference path="helper/RiverHelper.ts" />
/// <reference path="containers/JunctionContainer.ts" />

// Level 3
/// <reference path="core/Design.ts" />
/// <reference path="class/SheetObject.ts" />
/// <reference path="components/Sheet.ts" />
/// <reference path="view/View.ts" />
/// <reference path="model/TreeNode.ts" />
/// <reference path="model/TreeEdge.ts" />
/// <reference path="math/Point.ts" />
/// <reference path="math/Vector.ts" />
/// <reference path="containers/BaseContainer.ts" />

// Level 4
/// <reference path="class/Control.ts" />
/// <reference path="components/Quadrant.ts" />
/// <reference path="pattern/Stretch.ts" />
/// <reference path="pattern/Pattern.ts" />
/// <reference path="pattern/Store.ts" />
/// <reference path="view/ControlView.ts" />
/// <reference path="view/DragSelectView.ts" />
/// <reference path="view/SheetView.ts" />
/// <reference path="containers/StretchContainer.ts" />
/// <reference path="containers/EdgeContainer.ts" />
/// <reference path="containers/FlapContainer.ts" />
/// <reference path="containers/VertexContainer.ts" />

// Level 5
/// <reference path="class/ViewedControl.ts" />
/// <reference path="pattern/Configuration.ts" />
/// <reference path="view/LabeledView.ts" />
/// <reference path="view/JunctionView.ts" />
/// <reference path="view/RiverView.ts" />

// Level 6
/// <reference path="class/Draggable.ts" />
/// <reference path="view/FlapView.ts" />
/// <reference path="view/EdgeView.ts" />
/// <reference path="view/VertexView.ts" />

// Level 7
/// <reference path="components/Flap.ts" />
/// <reference path="components/Vertex.ts" />

@shrewd class BPStudio {

	@exported public readonly system: System;
	@exported public readonly designMap: Map<number, Design> = new Map();
	@exported public readonly display: Display;
	@exported public onDeprecate?: (title: string) => void;
	@exported @shrewd public design: Design | null = null;

	public readonly $el: HTMLElement;
	public readonly $paper: paper.PaperScope;

	constructor(selector: string) {
		if(typeof paper != "object") throw new Error("BPStudio requires paper.js.");

		let el = document.querySelector(selector);
		if(el == null || !(el instanceof HTMLElement)) {
			throw new Error("selector is not valid");
		}

		this.$el = el;
		this.$paper = new paper.PaperScope();
		this.display = new Display(this);
		this.system = new System(this);

		new Animator(this.update.bind(this), 50);
	}

	public load(json: string | object): Design {
		if(typeof json == "string") json = JSON.parse(json);
		return this.tryLoad(Migration.process(json, this.onDeprecate));
	}

	public create(json: any): Design {
		Object.assign(json, {
			version: Migration.current,
			tree: {
				nodes: [
					{ id: 0, name: "", x: 10, y: 10 },
					{ id: 1, name: "", x: 10, y: 13 },
					{ id: 2, name: "", x: 10, y: 7 }
				],
				edges: [
					{ n1: 0, n2: 1, length: 1 },
					{ n1: 0, n2: 2, length: 1 }
				]
			}
		});
		return this.restore(json);
	}

	public restore(json: any): Design {
		let design = new Design(this, Migration.process(json, this.onDeprecate));
		this.designMap.set(design.id, design);
		return design;
	}

	@exported public select(id: number | null): void {
		if(id != null) {
			let d = this.designMap.get(id);
			if(d) this.design = d;
		} else this.design = null;
	}

	@exported public close(id: number): void {
		let d = this.designMap.get(id);
		if(d) {
			this.designMap.delete(id);
			d.dispose();
		}
	}

	@exported public closeAll(): void {
		this.design = null;
		for(let d of this.designMap.values()) d.dispose();
		this.designMap.clear();
	}

	private tryLoad(design: RecursivePartial<JDesign>): Design {
		this.design = new Design(this, design);
		this.designMap.set(this.design.id, this.design);

		// 這邊順便直接更新，不然載入大專案的時候會跟 tab 之間有一點時間差
		this.update();

		return this.design;
	}

	@exported public toBPS(): string {
		if(!this.design) return "";
		let json = this.design.toJSON();
		delete json.history; // 存檔的時候不用儲存歷史
		let bps = JSON.stringify(json);
		let blob = new Blob([bps], { type: "application/octet-stream" });
		return URL.createObjectURL(blob);
	}

	@exported public get TreeMaker() { return TreeMaker; }

	/** 這是一個偵錯 glitch 用的屬性，正常情況不會用到（參見 Pattern.ts） */
	public get running() { return this._updating; }

	private _updating: boolean = false;

	/** 提供 UI 來註冊儲存 session 的動作 */
	@exported public onUpdate?: Action;

	/** 除了動畫呼叫之外，跟 tab 有關的操作也會呼叫此方法 */
	@exported public async update() {
		if(this._updating) return;
		this._updating = true;

		//if(perf) perfTime = 0;

		Shrewd.commit();
		if(this.design && !this.design.dragging) { // dragging 狀態必須在 await 之前進行判讀才會是可靠的
			this.design.history.flush(this.system.selection.items);
		}

		await PaperWorker.done();
		this.display.project.view.update();

		//if(perf && perfTime) console.log("Total time: " + perfTime + " ms");

		if(this.onUpdate) {
			this.onUpdate();
			delete this.onUpdate;
		}

		this._updating = false;
	}
}
