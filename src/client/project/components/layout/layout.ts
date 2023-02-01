
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

	public $update(model: UpdateModel): void {
		const design = this.$project.design;
		const prototype = design.$prototype;
		const tree = design.tree;

		// 更新輪廓
		for(const tag in model.graphics) {
			const target = this._parseTag(tag);
			if(target) target.$contours = model.graphics[tag].contours!;
		}

		// 角片增減
		for(const f of this.$flaps.values()) {
			if(tree.$vertices[f.id]?.degree != 1) this._removeFlap(f.id);
		}
		for(const f of prototype.layout.flaps) {
			this._addFlap(f, model.graphics["f" + f.id].contours!);
		}
		prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		// 河增減
		for(const r of this.$rivers.values()) {
			if(r.$edge.$v1.degree == 1 || r.$edge.$v2.degree == 1) this._removeRiver(r);
		}
		for(const e of prototype.tree.edges) {
			const tag = this._getEdgeTag(e);
			if(!model.graphics[tag]) continue;
			this._addRiver(e, model.graphics[tag].contours!);
		}
		prototype.tree.edges.length = 0;
		this.riverCount = this.$rivers.size;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $goToDual(subject: River | Flap[]): void {
		this.$project.design.tree.$sheet.$clearSelection();
		if(Array.isArray(subject)) {
			for(const f of subject) f.$vertex.$selected = true;
		} else {
			subject.$edge.$selected = true;
		}
		this.$project.design.mode = "tree";
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addFlap(f: JFlap, contours: Contour[]): void {
		const tree = this.$project.design.tree;
		const vertex = tree.$vertices[f.id]!;
		const edge = tree.$edges.get(f.id)!.values().next().value;
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
		river.$dispose();
		this.$rivers.delete(river.$edge.$v1.id, river.$edge.$v2.id);
	}

	private _getEdgeTag(e: JEdgeBase): string {
		const { n1, n2 } = e;
		return n1 < n2 ? `re${n1},${n2}` : `re${n2},${n1}`;
	}

	private _parseTag(tag: string): Flap | River | void {
		const m = tag.match(/^([a-z]+)(\d+(?:,\d+)*)(?:\.(.+))?$/);
		if(!m) return;
		const init = m[1], id = Number(m[2]), then = Number(m[3]);
		if(init == "f") return this.$flaps.get(id);
		if(init == "re") return this.$rivers.get(id, then);
	}
}
