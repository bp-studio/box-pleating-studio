
import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { shallowRef } from "client/shared/decorators";
import { Flap } from "./flap";
import { River } from "./river";
import { Sheet } from "../sheet";

import type { Container } from "@pixi/display";
import type { Project } from "client/project/project";
import type { UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { JLayout, JSheet } from "shared/json";

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
		} as JLayout;
	}

	public $update(model: UpdateModel): void {
		const design = this.$project.design;
		const prototype = design.$prototype;
		const tree = design.tree;

		for(const f of prototype.layout.flaps) {
			f.contour = model.graphics["f" + f.id].contours!;
			const vertex = tree.$vertices[f.id]!;
			const edge = tree.$edges.get(f.id)!.values().next().value;
			const flap = new Flap(this, f, vertex, edge);
			this.$flaps.set(f.id, flap);
			this.$sheet.$addChild(flap);
		}
		prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		for(const e of prototype.tree.edges) {
			const { n1, n2 } = e;
			const tag = n1 < n2 ? `re${n1},${n2}` : `re${n2},${n1}`;
			const edge = tree.$edges.get(n1, n2);
			if(!model.graphics[tag] || !edge) continue;
			const river = new River(this, tag, edge, model.graphics[tag].contours!);
			this.$rivers.set(n1, n2, river);
			this.$sheet.$addChild(river);
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
}
