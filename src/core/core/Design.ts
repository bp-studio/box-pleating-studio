
interface IDesignObject {
	readonly design: Design;
}

//////////////////////////////////////////////////////////////////
/**
 * `Design` 是包含了樹狀結構以及摺痕圖的一個完整專案單位。
 *
 * 這個檔案包含了 `Design` 的對外操作方法；其它核心程式碼整理在 `DesignBase` 之中。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Design extends DesignBase implements ISerializable<JDesign>, IDesignObject {

	@shrewd public fullscreen: boolean;

	@shrewd public mode: string;

	@action public description?: string;

	@action public title: string;

	protected readonly LayoutSheet: Sheet;

	protected readonly TreeSheet: Sheet;

	public readonly tree: Tree;

	private _modified: boolean = false;

	constructor(studio: BPStudio, profile: RecursivePartial<JDesign>) {
		super(studio, profile);

		this.LayoutSheet = new Sheet(this, this.data.layout.sheet,
			() => this.flaps.values(),
			() => this.rivers.values(),
			() => this.stretches.values(),
			() => this.devices,
		);
		this.TreeSheet = new Sheet(this, this.data.tree.sheet,
			() => this.edges.values(),
			() => this.vertices.values()
		);
		this.title = this.data.title;;
		this.fullscreen = this.data.fullscreen;
		this.description = this.data.description;
		this.mode = this.data.mode;

		this.tree = new Tree(this, this.data.tree.edges);
	}

	@shrewd public get sheet(): Sheet {
		return this.mode == "layout" ? this.LayoutSheet : this.TreeSheet;
	}

	public get modified(): boolean {
		// TODO: 以後這邊要根據歷史移動來決定
		return this._modified;
	}

	public get design(): Design {
		return this;
	}

	public notifySave() {
		this._modified = false;
	}

	public takeAction(action: () => void) {
		// TODO: 以後這邊要改成歷史機制
		this._modified = true;
		action();
	}

	public fieldChange(obj: any, prop: string, oldValue: any, newValue: any) {
		// TODO: 以後這邊要改成歷史機制
		this._modified = true;
	}

	public toJSON(): JDesign {
		this.tree.generateJID();
		let result = {
			title: this.title,
			description: this.description,
			fullscreen: this.fullscreen,
			version: Migration.current,
			mode: this.mode,
			layout: {
				sheet: this.LayoutSheet.toJSON(),
				flaps: this.flaps.toJSON(),
				stretches: this.stretches.toJSON()
			},
			tree: {
				sheet: this.TreeSheet.toJSON(),
				nodes: this.vertices.toJSON(),
				edges: this.sortJEdge()
			}
		};
		this.tree.jidMap.clear();
		return result;
	}

	public deleteVertices(vertices: readonly Vertex[]) {
		this.takeAction(() => {
			let arr = vertices.concat().sort((a, b) => a.node.degree - b.node.degree);
			while(this.vertices.size > 3) {
				let v = arr.find(v => v.node.degree == 1);
				if(!v) break;
				v.node.dispose()
				arr.splice(arr.indexOf(v), 1);
				Shrewd.commit();
			}
		});
	}

	public deleteFlaps(flaps: readonly Flap[]) {
		this.takeAction(() => {
			for(let f of flaps) {
				if(this.vertices.size == 3) break;
				f.node.dispose();
				Shrewd.commit();
			}
		})
	}

	public clearCPSelection() {
		for(let c of this.LayoutSheet.controls) c.selected = false;
	}

	public clearTreeSelection() {
		for(let c of this.TreeSheet.controls) c.selected = false;
	}

	public flapToVertex(flaps: Flap[]) {
		this.clearTreeSelection();
		for(let f of flaps) {
			let v = this.vertices.get(f.node)
			if(v) v.selected = true;
		}
		this.mode = "tree";
	}

	public vertexToFlap(vertices: Vertex[]) {
		this.clearCPSelection();
		for(let v of vertices) {
			let f = this.flaps.get(v.node)
			if(f) f.selected = true;
		}
		this.mode = "layout";
	}

	public riverToEdge(river: River) {
		this.clearTreeSelection();
		let e = this.edges.get(river.edge);
		if(e) e.selected = true;
		this.mode = "tree";
	}

	public edgeToRiver(edge: Edge) {
		this.clearCPSelection();
		let te = edge.edge;
		if(te.isRiver) {
			let r = this.rivers.get(te);
			if(r) r.selected = true;
		} else {
			let n = te.n1.degree == 1 ? te.n1 : te.n2;
			let f = this.flaps.get(n);
			if(f) f.selected = true;
		}
		this.mode = "layout";
	}
}
