
import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { shallowRef } from "client/shared/decorators";
import { Flap } from "./flap";
import { River } from "./river";
import { Sheet } from "../sheet";

import type { Contour } from "shared/types/geometry";
import type { Container } from "@pixi/display";
import type { Project } from "client/project/project";
import type { UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { JEdge, JEdgeBase, JFlap, JLayout, JSheet } from "shared/json";

//=================================================================
/**
 * {@link Layout} 負責提供佈局檢視當中可用的操作與相關邏輯
 */
//=================================================================
export class Layout implements ISerializable<JLayout> {

	@shallowRef public flapCount: number = 0;
	@shallowRef public riverCount: number = 0;

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $flaps: Map<number, Flap> = new Map();
	public readonly $rivers: IDoubleMap<number, River> = new ValuedIntDoubleMap();

	private _updating: Promise<void> | undefined = undefined;
	private _pending: boolean = false;

	constructor(project: Project, parentView: Container, json: JSheet) {
		this.$project = project;
		this.$sheet = new Sheet(project, parentView, json);

		if(DEBUG_ENABLED) this.$sheet.$view.name = "LayoutSheet";
	}

	public toJSON(): JLayout {
		return {
			sheet: this.$sheet.toJSON(),
			flaps: [...this.$flaps.values()].map(f => f.toJSON()),
			stretches: [],
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $update(model: UpdateModel): void {
		const design = this.$project.design;
		const prototype = design.$prototype;
		const tree = design.tree;

		// 更新輪廓
		for(const tag in model.graphics) {
			const target = this._parseTag(tag);
			if(target) target.$contours = model.graphics[tag].contours!;
		}

		for(const f of this.$flaps.values()) {
			const vertex = tree.$vertices[f.id];
			const edgeDisposed = !f.$edge.$v1; // 原本的角片被分割了
			if(!vertex || vertex.degree != 1 || edgeDisposed) {
				if(vertex) {
					if(edgeDisposed) {
						prototype.layout.flaps.push(f.toJSON());
						model.graphics["f" + f.id] ||= { contours: f.$contours };
					} else {
						// 角片變成河
						model.add.edges.push(f.$edge.toJSON());
					}
				}
				this._removeFlap(f.id);
			}
		}
		for(const r of this.$rivers.values()) {
			const v = r.$edge.$getLeaf();
			if(v) this._removeRiver(r); // 河變成角片
		}

		for(const f of prototype.layout.flaps) {
			this._addFlap(f, model.graphics["f" + f.id].contours!);
		}
		prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		for(const e of model.add.edges) {
			const edge = tree.$edges.get(e.n1, e.n2)!;
			if(edge.$v1.degree == 1 || edge.$v2.degree == 1) continue;
			const tag = this._getEdgeTag(e);
			if(!model.graphics[tag]) continue;
			this._addRiver(e, model.graphics[tag].contours!);
		}
		this.riverCount = this.$rivers.size;
	}

	/** 因為刪除順序上的緣故，這個方法必須獨立出來 */
	public $cleanUp(model: UpdateModel): void {
		for(const e of model.remove.edges) {
			const river = this.$rivers.get(e.n1, e.n2);
			if(river) this._removeRiver(river);
		}
	}

	public $goToDual(subject: River | Flap[]): void {
		this.$project.design.tree.$sheet.$clearSelection();
		if(Array.isArray(subject)) {
			for(const f of subject) f.$vertex.$selected = true;
		} else {
			subject.$edge.$selected = true;
		}
		this.$project.design.mode = "tree";
	}

	public async $updateFlap(flaps: Flap[]): Promise<void> {
		if(this._updating) {
			if(this._pending) return;
			this._pending = true;
			await this._updating;
			this.$updateFlap(flaps);
			this._pending = false;
			return;
		}
		this._updating = this.$project.$callStudio("layout", "updateFlap", flaps.map(f => f.toJSON()));
		await this._updating;
		this._updating = undefined;
	}

	public $createFlapPrototype(id: number, p: IPoint): JFlap {
		return {
			id,
			x: p.x,
			y: p.y,
			width: 0,
			height: 0,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addFlap(f: JFlap, contours: Contour[]): void {
		const tree = this.$project.design.tree;
		const vertex = tree.$vertices[f.id]!;
		const edge = tree.$getFirstEdge(vertex);
		const flap = new Flap(this, f, vertex, edge, contours);
		this.$flaps.set(f.id, flap);
		this.$sheet.$addChild(flap);
	}

	private _removeFlap(id: number): void {
		const flap = this.$flaps.get(id)!;
		this.$sheet.$removeChild(flap);
		flap.$dispose();
		this.$flaps.delete(id);
	}

	private _addRiver(e: JEdge, contours: Contour[]): void {
		const tree = this.$project.design.tree;
		const { n1, n2 } = e;
		const edge = tree.$edges.get(n1, n2);
		if(!edge) return;
		const river = new River(this, edge, contours);
		this.$rivers.set(n1, n2, river);
		this.$sheet.$addChild(river);
	}

	private _removeRiver(river: River): void {
		this.$sheet.$removeChild(river);
		this.$rivers.delete(river.$edge.$v1.id, river.$edge.$v2.id);
		river.$dispose();
	}

	private _getEdgeTag(e: JEdgeBase): string {
		const { n1, n2 } = e;
		return n1 < n2 ? `re${n1},${n2}` : `re${n2},${n1}`;
	}

	private _parseTag(tag: string): Flap | River | void {
		const m = tag.match(/^([a-z]+)(\d+(?:,\d+)*)(?:\.(.+))?$/);
		if(!m) return;
		const init = m[1];
		if(init == "f") return this.$flaps.get(Number(m[2]));
		if(init == "re") {
			const [n1, n2] = m[2].split(",").map(n => Number(n));
			return this.$rivers.get(n1, n2);
		}
	}
}
