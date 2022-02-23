import * as CT from "./containers";
import { Flap, River, Sheet, Vertex } from "./components";
import { Tree } from "bp/content/context";
import { HistoryService, action } from "bp/content/changes";
import { OptionService } from "bp/env/service";
import { shrewdStatic } from "bp/global";
import { ArrayUtil, deepCopy } from "bp/util";
import { Mountable } from "bp/class";
import { Migration } from "bp/content/patches";
import type { Control } from "./class";
import type { Studio, StudioBase } from "bp/env";
import type { DesignMode, JDesign } from "bp/content/json";
import type { IDesign, ITagObject } from "bp/content/interface";

//=================================================================
/**
 * {@link Design} 是包含了樹狀結構以及摺痕圖的一個完整專案單位。
 */
//=================================================================

@shrewd export class Design extends Mountable implements ISerializable<JDesign>, IDesign {

	/** @exports */
	@shrewd public mode: DesignMode;

	/** @exports */
	@action public description?: string;

	/** @exports */
	@action public title: string;

	private static _id = 0;

	/** 物件初始設定值 */
	public readonly $options: OptionService;

	/**
	 * 給 Vue 排序用的 id
	 *
	 * @exports
	 */
	public readonly id: number = Design._id++;

	public readonly $LayoutSheet: Sheet;
	public readonly $TreeSheet: Sheet;
	public readonly $tree: Tree;

	/** 管理 Design 的編輯歷史 */
	public readonly $history: HistoryService | null;

	constructor(studio: StudioBase, design: RecursivePartial<JDesign>) {
		super(studio);

		const data = deepCopy<JDesign>(Migration.$getSample(), design);
		if(data.tree.nodes.length < Tree.$MIN_NODES) throw new Error("Invalid format.");

		this.$options = new OptionService(data);

		this.$LayoutSheet = new Sheet(this, "layout", data.layout.sheet,
			() => this.$flaps.values(),
			() => this.$rivers.values(),
			() => this.$stretches.values(),
			() => this.$stretches.$devices
		);
		this.$TreeSheet = new Sheet(this, "tree", data.tree.sheet,
			() => this.$edges.values(),
			() => this.$vertices.values()
		);

		this.title = data.title;
		this.description = data.description;
		this.mode = data.mode;

		this.$history = HistoryService.$create(this, data.history);

		// Tree 相依於 HistoryManager
		this.$tree = new Tree(this, data.tree.edges);

		// Junctions 相依於 Tree
		this.$junctions = new CT.JunctionContainer(this);
	}

	public readonly $tag = "design";

	protected $onDispose(): void {
		this.$edges.$dispose();
		this.$vertices.$dispose();
		this.$rivers.$dispose();
		this.$flaps.$dispose();
		this.$stretches.$dispose();
		this.$junctions.$dispose();
		super.$onDispose();
	}

	public get $design(): this { return this; }

	/**
	 * 目前的 {@link Design} 是否正在拖曳當中。
	 *
	 * 跟 {@link DragController.$on} 的小差異是，前者只有真的發生整數拖曳時才會為真，
	 * 後者則只要滑鼠有微微拖曳就會為真。
	 */
	@shrewd public $dragging: boolean = false;

	@shrewdStatic public get _isActive(): boolean {
		return (this.$mountTarget as Studio).$design == this;
	}

	public readonly $vertices = new CT.VertexContainer(this);
	public readonly $edges = new CT.EdgeContainer(this);
	public readonly $rivers = new CT.RiverContainer(this);
	public readonly $flaps = new CT.FlapContainer(this);
	public readonly $stretches = new CT.StretchContainer(this);
	public readonly $junctions: CT.JunctionContainer;

	/** @exports */
	@shrewdStatic public get sheet(): Sheet {
		return this.mode == "layout" ? this.$LayoutSheet : this.$TreeSheet;
	}

	public toJSON(session: boolean = false): JDesign {
		let result!: JDesign;
		let process = (): void => {
			result = {
				title: this.title,
				description: this.description,
				version: Migration.$getCurrentVersion(),
				mode: this.mode,
				layout: {
					sheet: this.$LayoutSheet.toJSON(session),
					flaps: this.$flaps.toJSON(),
					stretches: this.$stretches.toJSON(),
				},
				tree: {
					sheet: this.$TreeSheet.toJSON(session),
					nodes: this.$vertices.toJSON(),
					edges: this.$edges.$sort(),
				},
			};
			if(session) result.history = this.$history?.toJSON();
		};
		if(session) process();
		else this.$tree.withJID(process);
		return result;
	}

	/** @exports */
	public selectAll(): void {
		this.unselectAll();
		if(this.mode == "layout") this.$flaps.$selectAll();
		if(this.mode == "tree") this.$vertices.$selectAll();
	}

	/** @exports */
	public unselectAll(): void {
		this.sheet.$activeControls.forEach(c => c.$selected = false);
	}

	/** 根據 tag 來找出唯一的對應物件 */
	public $query(tag: string): ITagObject | undefined {
		if(tag == "design") return this;
		if(tag == "layout") return this.$LayoutSheet;
		if(tag == "tree") return this.$TreeSheet;
		let m = tag.match(/^([a-z]+)(\d+(?:,\d+)*)(?:\.(.+))?$/);
		if(m) {
			let init = m[1], id = m[2], then = m[3];
			if(init == "s") return this.$stretches.get(id);
			if(init == "r") return this.$stretches.get(id)!.$repository?.$query(then);

			let t = this.$tree;
			if(init == "e" || init == "re" || init == "ee") {
				let edge = t.$find(id);
				if(!edge) return undefined;
				if(init == "e") return edge;
				if(init == "re") return this.$rivers.get(edge);
				if(init == "ee") return this.$edges.get(edge);
			}

			let n = t.$node.get(Number(id))!;
			if(init == "n") return n;
			if(init == "f") return this.$flaps.get(n);
			if(init == "v") return this.$vertices.get(n);
		}
		return undefined;
	}

	/** 處理來自 UI 的物件刪除請求 */
	public $delete(items: Control[]): void {
		let first = items[0];
		if(ArrayUtil.$isTypedArray(items, Flap)) this.$flaps.$delete(items);
		if(ArrayUtil.$isTypedArray(items, Vertex)) this.$vertices.$delete(items);
		if(first instanceof River) first.$delete();
	}

	public $clearSelection(): void {
		this.sheet.$clearSelection();
	}
}
