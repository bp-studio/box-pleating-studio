import { Container } from "@pixi/display";

import { shallowRef } from "client/shared/decorators";
import { View } from "client/base/view";
import { designs } from "client/screen/display";
import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { Sheet } from "./components/sheet";
import { MOUNTED } from "client/base/mountable";
import { Vertex } from "./components/tree/vertex";
import { Edge } from "./components/tree/edge";
import { Flap } from "./components/layout/flap";
import { River } from "./components/layout/river";

import type { UpdateModel } from "core/service/updateModel";
import type { DesignMode, JDesign } from "shared/json";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";

//=================================================================
/**
 * {@link Design} 是專案當中的主角。
 */
//=================================================================
export class Design extends View {

	@shallowRef public title: string;
	@shallowRef public description: string;
	@shallowRef public mode: DesignMode;
	@shallowRef public flapCount: number = 0;
	@shallowRef public riverCount: number = 0;
	@shallowRef public vertexCount: number = 0;

	public readonly $layoutSheet: Sheet;
	public readonly $treeSheet: Sheet;

	public readonly $flaps: Map<number, Flap> = new Map();
	public readonly $vertices: Map<number, Vertex> = new Map();
	public readonly $edges: IDoubleMap<number, Edge> = new ValuedIntDoubleMap();
	public readonly $rivers: IDoubleMap<number, River> = new ValuedIntDoubleMap();

	/** 在物件尚未建立之前，用來暫存各種物件的原型資料 */
	public readonly $prototype: JDesign;

	constructor(json: JDesign, id: number) {
		super();
		this.$prototype = json;
		this.title = json.title ?? "";
		this.description = json.description ?? "";
		this.mode = json.mode ?? "layout";

		const view = this.$addRootObject(new Container(), designs);
		this.addEventListener(MOUNTED, e => view.visible = e.state);

		this.$layoutSheet = new Sheet(json.layout.sheet, view);
		this.$treeSheet = new Sheet(json.tree.sheet, view);
		this.$addChild(this.$layoutSheet);
		this.$addChild(this.$treeSheet);

		this.$reactDraw(this._onModeChanged);

		if(DEBUG_ENABLED) {
			view.name = "Design #" + id;
			this.$layoutSheet.$view.name = "LayoutSheet";
			this.$treeSheet.$view.name = "TreeSheet";
		}
	}

	public get sheet(): Sheet {
		return this.mode == "layout" ? this.$layoutSheet : this.$treeSheet;
	}

	public toJSON(): JDesign {
		return {
			title: this.title,
			mode: this.mode,
			layout: {
				sheet: this.$layoutSheet.toJSON(),
			},
			tree: {
				sheet: this.$treeSheet.toJSON(),
			},
		} as JDesign;
	}

	public get patternNotFound(): boolean {
		return false;
	}

	/** 根據 Core 傳回的更新模型來進行更新 */
	public $update(model: UpdateModel): void {
		const treeSheet = this.$treeSheet;
		const layoutSheet = this.$layoutSheet;

		for(const node of model.add.nodes) {
			const json = this.$prototype.tree.nodes.find(n => n.id == node);
			if(!json) continue;
			const vertex = new Vertex(json, treeSheet);
			treeSheet.$addChild(vertex);
			this.$vertices.set(json.id, vertex);
		}
		this.vertexCount = this.$vertices.size;

		for(const e of model.add.edges) {
			const v1 = this.$vertices.get(e.n1);
			const v2 = this.$vertices.get(e.n2);
			if(!v1 || !v2) continue;
			const edge = new Edge(v1, v2, e.length, treeSheet);
			treeSheet.$addChild(edge);
			this.$edges.set(v1.id, v2.id, edge);
		}

		for(const f of this.$prototype.layout.flaps) {
			f.contour = model.graphics["f" + f.id].contours!;
			const vertex = this.$vertices.get(f.id)!;
			const edge = this.$edges.get(f.id)!.values().next().value;
			const flap = new Flap(f, vertex, edge, layoutSheet);
			this.$flaps.set(f.id, flap);
			layoutSheet.$addChild(flap);
		}
		this.$prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		for(const e of this.$prototype.tree.edges) {
			const { n1, n2 } = e;
			const tag = n1 < n2 ? `re${n1},${n2}` : `re${n2},${n1}`;
			if(!model.graphics[tag]) continue;
			const river = new River(tag, model.graphics[tag].contours!, layoutSheet);
			this.$rivers.set(n1, n2, river);
			layoutSheet.$addChild(river);
		}
		this.$prototype.tree.edges.length = 0;
		this.riverCount = this.$rivers.size;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _onModeChanged(): void {
		const mode = this.mode;
		this.$layoutSheet.$toggle(mode === "layout");
		this.$treeSheet.$toggle(mode === "tree");
	}
}
