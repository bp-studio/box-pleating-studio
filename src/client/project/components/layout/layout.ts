
import { AlphaFilter } from "@pixi/filter-alpha";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { shallowRef } from "client/shared/decorators";
import { Flap } from "./flap";
import { River } from "./river";
import { Sheet } from "../sheet";
import { Layer } from "client/types/layers";
import { drawArcPolygon } from "client/screen/contourUtil";
import { RED } from "client/shared/constant";

import type { Contour } from "shared/types/geometry";
import type { Container } from "@pixi/display";
import type { Project } from "client/project/project";
import type { UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { JEdge, JEdgeBase, JFlap, JLayout, JSheet } from "shared/json";

const JUNCTION_ALPHA = 0.5;

//=================================================================
/**
 * {@link Layout} manages the operations and logics in the layout view.
 */
//=================================================================
export class Layout implements ISerializable<JLayout> {

	@shallowRef public flapCount: number = 0;
	@shallowRef public riverCount: number = 0;
	@shallowRef public invalidCount: number = 0;

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $flaps: Map<number, Flap> = new Map();
	public readonly $rivers: IDoubleMap<number, River> = new ValuedIntDoubleMap();
	public readonly $junctions: Map<string, SmoothGraphics> = new Map();

	/** The flaps that are about to be updated. */
	private readonly _pendingUpdate = new Set<Flap>();

	/** The new flaps that should be synced. */
	public readonly $syncFlaps = new Map<number, Flap>();

	/** The updating task in progress. */
	private _updating: Promise<void> = Promise.resolve();

	constructor(project: Project, parentView: Container, json: JSheet) {
		this.$project = project;
		this.$sheet = new Sheet(project, parentView, json);

		const filter = new AlphaFilter(JUNCTION_ALPHA);
		this.$sheet.$layers[Layer.$junction].filters = [filter];

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
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $update(model: UpdateModel): void {
		const design = this.$project.design;
		const prototype = design.$prototype;
		const tree = design.tree;

		this._updateJunctions(model);

		// Update contours
		for(const tag in model.graphics) {
			const target = this._parseTag(tag);
			if(target) target.$contours = model.graphics[tag].contours!;
		}

		for(const f of this.$flaps.values()) {
			const vertex = tree.$vertices[f.id];
			const edgeDisposed = !f.$edge.$v1; // The original flap is split
			if(!vertex || !vertex.isLeaf || edgeDisposed) {
				if(vertex) {
					if(edgeDisposed) {
						prototype.layout.flaps.push(f.toJSON());
						model.graphics["f" + f.id] ||= { contours: f.$contours };
					} else {
						// A flap turns into a river
						model.add.edges.push(f.$edge.toJSON());
					}
				}
				this._removeFlap(f.id);
			}
		}
		for(const r of this.$rivers.values()) {
			const v = r.$edge.$getLeaf();
			if(v) this._removeRiver(r); // A river turns into a flap
		}

		for(const f of prototype.layout.flaps) {
			this._addFlap(f, model.graphics["f" + f.id].contours!);
		}
		prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		for(const e of model.add.edges) {
			const edge = tree.$edges.get(e.n1, e.n2)!;
			if(edge.$v1.isLeaf || edge.$v2.isLeaf) continue;
			const tag = this._getEdgeTag(e);
			if(!model.graphics[tag]) continue;
			this._addRiver(e, model.graphics[tag].contours!);
		}
		this.riverCount = this.$rivers.size;
	}

	/** We separate this method for the execution order. */
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

	public $updateFlap(flap: Flap): void {
		if(this._pendingUpdate.size === 0) {
			Promise.resolve().then(this._flushUpdate);
		}
		this._pendingUpdate.add(flap);
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
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private readonly _flushUpdate = async (): Promise<void> => {
		await this._updating; // Wait until the last update to complete
		const flaps: JFlap[] = [];
		for(const f of this._pendingUpdate) flaps.push(f.toJSON());
		this._pendingUpdate.clear();
		const dragging = this.$project.$isDragging;
		this._updating = this.$project.$callStudio("layout", "updateFlap", flaps, dragging);
	};

	private _addFlap(f: JFlap, contours: Contour[]): void {
		const tree = this.$project.design.tree;
		const vertex = tree.$vertices[f.id]!;
		const edge = tree.$getFirstEdge(vertex);
		const flap = new Flap(this, f, vertex, edge, contours);
		this.$flaps.set(f.id, flap);
		if(vertex.$isNew) this.$syncFlaps.set(f.id, flap);
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

	private _updateJunctions(model: UpdateModel): void {
		const junctionLayer = this.$sheet.$layers[Layer.$junction];
		for(const tag in model.add.junctions) {
			let sg = this.$junctions.get(tag);
			if(!sg) {
				sg = new SmoothGraphics();
				sg.alpha = JUNCTION_ALPHA;
				this.$junctions.set(tag, sg);
				junctionLayer.addChild(sg);
				this.invalidCount++;
			}
			sg.clear();
			drawArcPolygon(sg, model.add.junctions[tag], RED);
		}
		for(const tag of model.remove.junctions) {
			const sg = this.$junctions.get(tag)!;
			this.invalidCount--;
			this.$junctions.delete(tag);
			junctionLayer.removeChild(sg);
			sg.destroy();
		}
	}
}
