// Level 0
/// <reference path="global/import.ts" />
/// <reference path="util/Decorators.ts" />
/// <reference path="pattern/Partitioner.ts" />
/// <reference path="pattern/Region.ts" />
/// <reference path="class/Disposable.ts" />

// Level 1
/// <reference path="pattern/Piece.ts" />
/// <reference path="pattern/AddOn.ts" />
/// <reference path="model/DoubleMap.ts" />
/// <reference path="mapping/BaseMapping.ts" />
/// <reference path="mapping/DoubleMapping.ts" />
/// <reference path="math/Fraction.ts" />
/// <reference path="pattern/Partition.ts" />

// Level 2
/// <reference path="mapping/Mapping.ts" />
/// <reference path="mapping/GroupMapping.ts" />
/// <reference path="class/Mountable.ts" />
/// <reference path="model/Tree.ts" />
/// <reference path="math/Couple.ts" />

// Level 3
/// <reference path="core/DesignBase.ts" />
/// <reference path="class/SheetObject.ts" />
/// <reference path="components/Sheet.ts" />
/// <reference path="view/View.ts" />
/// <reference path="model/TreeNode.ts" />
/// <reference path="model/TreeEdge.ts" />
/// <reference path="model/TreePath.ts" />
/// <reference path="math/Point.ts" />
/// <reference path="math/Vector.ts" />

// Level 4
/// <reference path="core/Design.ts" />
/// <reference path="class/Control.ts" />
/// <reference path="components/Quadrant.ts" />
/// <reference path="pattern/Stretch.ts" />
/// <reference path="pattern/Pattern.ts" />
/// <reference path="pattern/Store.ts" />
/// <reference path="view/ControlView.ts" />
/// <reference path="view/DragSelectView.ts" />
/// <reference path="view/SheetView.ts" />

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

	public readonly $el: HTMLElement;
	public readonly $display: Display;
	public readonly system: System;
	public readonly $paper: paper.PaperScope;

	public readonly designMap: Map<number, Design> = new Map();

	@shrewd public design: Design | null = null;

	public onDeprecate?: (title: string) => void;

	constructor(selector: string) {
		let el = document.querySelector(selector);
		if(el == null || !(el instanceof HTMLElement)) {
			throw new Error("selector is not valid");
		}

		this.$el = el;
		this.$paper = new paper.PaperScope();
		this.$display = new Display(this);
		this.system = new System(this);
	}

	public load(json: string | object): Design {
		if(typeof json == "string") json = JSON.parse(json);
		return this.tryLoad(Migration.process(json, this.onDeprecate));
	}

	public create(json: any): Design {
		Object.assign(json, {
			version: Migration.current,
			layout: {
				flaps: [
					{ id: 0, width: 0, height: 0, x: 8, y: 7 },
					{ id: 2, width: 0, height: 0, x: 8, y: 9 }
				]
			},
			tree: {
				nodes: [
					{ id: 0, name: "", x: 10, y: 13 },
					{ id: 1, name: "", x: 10, y: 10 },
					{ id: 2, name: "", x: 10, y: 7 }
				],
				edges: [
					{ n1: 0, n2: 1, length: 1 },
					{ n1: 2, n2: 1, length: 1 }
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

	public select(id: number | null): void {
		if(id != null) {
			let d = this.designMap.get(id);
			if(d) this.design = d;
		} else this.design = null;
	}

	public close(id: number): void {
		let d = this.designMap.get(id);
		if(d) {
			this.designMap.delete(id);
			d.dispose();
		}
	}

	public closeAll(): void {
		this.design = null;
		for(let d of this.designMap.values()) d.dispose();
		this.designMap.clear();
	}

	private tryLoad(design: RecursivePartial<JDesign>): Design {
		this.design = new Design(this, design);
		this.designMap.set(this.design.id, this.design);
		Shrewd.commit();
		return this.design;
	}

	public toBPS(): string {
		if(!this.design) return "";
		let json = JSON.stringify(this.design);
		let blob = new Blob([json], { type: "application/octet-stream" });
		return URL.createObjectURL(blob);
	}

	public get TreeMaker() { return TreeMaker; }
}
