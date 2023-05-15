
import { AlphaFilter } from "@pixi/filter-alpha";

import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { shallowRef } from "client/shared/decorators";
import { Flap } from "./flap";
import { River } from "./river";
import { Sheet } from "../sheet";
import { Layer } from "client/shared/layers";
import { Junction } from "./junction";
import ProjectService from "client/services/projectService";
import { View } from "client/base/view";
import { style } from "client/services/styleService";
import { Stretch } from "./stretch";

import type { Device } from "./device";
import type { Container } from "@pixi/display";
import type { Project } from "client/project/project";
import type { GraphicsData, UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { JEdge, JEdgeBase, JFlap, JLayout, JSheet, JViewport } from "shared/json";

//=================================================================
/**
 * {@link Layout} manages the operations and logics in the layout view.
 *
 * Itself is also derived from {@link View},
 * as it handles the drawing of invalid junctions.
 */
//=================================================================
export class Layout extends View implements ISerializable<JLayout> {

	@shallowRef public flapCount: number = 0;
	@shallowRef public riverCount: number = 0;
	@shallowRef public invalidCount: number = 0;

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $flaps: Map<number, Flap> = new Map();
	public readonly $rivers: IDoubleMap<number, River> = new ValuedIntDoubleMap();
	public readonly $junctions: Map<string, Junction> = new Map();
	public readonly $stretches: Map<string, Stretch> = new Map();

	/** The flaps that are about to be updated. */
	private readonly _pendingUpdate = new Set<Flap>();

	/** The new flaps that should be synced. */
	public readonly $syncFlaps = new Map<number, Flap>();

	/** The updating task in progress. */
	private _updating: Promise<void> = Promise.resolve();

	/** Cached value of scale. */
	private _scale: number = 0;

	constructor(project: Project, parentView: Container, json: JSheet, state?: JViewport) {
		super();
		this.$project = project;
		this.$sheet = new Sheet(project, parentView, "layout", json, state);
		this.$sheet.$addChild(this);

		const filter = new AlphaFilter(style.junction.alpha);
		this.$sheet.$layers[Layer.$junction].filters = [filter];

		this.$reactDraw(this._redrawJunctions);
	}

	public toJSON(): JLayout {
		return {
			sheet: this.$sheet.toJSON(),
			flaps: [...this.$flaps.values()].map(f => f.toJSON()),
			stretches: [...this.$stretches.values()].map(s => s.toJSON()),
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $update(model: UpdateModel): void {
		const design = this.$project.design;
		const prototype = design.$prototype;
		const tree = design.tree;

		this.invalidCount += this._updateJunctions(model);

		// Update contours
		for(const tag in model.graphics) {
			const target = this._parseTag(tag);
			if(target) {
				target.$redraw(model.graphics[tag]);
			}
		}

		const newRivers = model.edit.filter(e => e[0]).map(e => e[1]);

		this._updateStretches(model);
		this._removeFlaps(model, newRivers);
		for(const r of this.$rivers.values()) {
			const v = r.$edge.$getLeaf();
			if(v) this._removeRiver(r); // A river turns into a flap
		}

		for(const f of prototype.layout.flaps) {
			this._addFlap(f, model.graphics["f" + f.id]);
		}
		prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		for(const r of newRivers) {
			const edge = tree.$edges.get(r.n1, r.n2)!;
			if(edge.$v1.isLeaf || edge.$v2.isLeaf) continue;
			const tag = this._getEdgeTag(r);
			if(!model.graphics[tag]) continue;
			this._addRiver(r, model.graphics[tag]);
		}
		this.riverCount = this.$rivers.size;
	}

	/** We separate this method for the execution order. */
	public $cleanUp(model: UpdateModel): void {
		for(const edit of model.edit.filter(e => !e[0])) {
			const river = this.$rivers.get(edit[1].n1, edit[1].n2);
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

	public $updateFlap(flap: Flap): Promise<void> {
		this._pendingUpdate.add(flap);
		return flapUpdatePromise ||= Promise.resolve().then(this._flushUpdate);
	}

	public $switchConfig(stretchId: string, to: number): Promise<void> {
		return this.$project.$core.layout.switchConfig(stretchId, to);
	}

	public $switchPattern(stretchId: string, to: number): Promise<void> {
		return this.$project.$core.layout.switchPattern(stretchId, to);
	}

	public $moveDevice(device: Device): Promise<void> {
		return this.$project.$core.layout.moveDevice(device.stretch.id, device.$index, device.$location);
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
		flapUpdatePromise = undefined;
		const flaps: JFlap[] = [];
		for(const f of this._pendingUpdate) flaps.push(f.$updateDrawParams());
		this._pendingUpdate.clear();
		const dragging = this.$project.$isDragging;
		const prototypes = this.$project.design.$prototype.layout.stretches;
		this._updating = this.$project.$core.layout.updateFlap(flaps, dragging, prototypes);
		await this._updating;
	};

	private _addFlap(f: JFlap, graphics: GraphicsData): void {
		const tree = this.$project.design.tree;
		const vertex = tree.$vertices[f.id]!;
		const edge = tree.$getFirstEdge(vertex);
		if(!edge) debugger;
		const flap = new Flap(this, f, vertex, edge, graphics);
		this.$flaps.set(f.id, flap);
		if(vertex.$isNew) this.$syncFlaps.set(f.id, flap);
		this.$sheet.$addChild(flap);
		this.$project.history.$construct(flap.$toMemento());
	}

	private _removeFlaps(model: UpdateModel, newRivers: JEdge[]): void {
		const design = this.$project.design;
		const prototype = design.$prototype;
		const tree = design.tree;
		for(const f of this.$flaps.values()) {
			const vertex = tree.$vertices[f.id];
			const edgeDisposed = !f.$edge.$v1; // The original flap is split
			if(!vertex || !vertex.isLeaf || edgeDisposed) {
				if(vertex) {
					if(edgeDisposed) {
						prototype.layout.flaps.push(f.toJSON());
						model.graphics["f" + f.id] ||= f.$graphics;
					} else {
						// A flap turns into a river
						newRivers.push(f.$edge.toJSON());
					}
				}
				this._removeFlap(f.id);
			}
		}
	}

	private _removeFlap(id: number): void {
		const flap = this.$flaps.get(id)!;
		const memento = flap.$toMemento();
		this.$sheet.$removeChild(flap);
		flap.$dispose();
		this.$flaps.delete(id);
		this.$project.history.$destruct(memento);
	}

	private _addRiver(e: JEdge, graphics: GraphicsData): void {
		const tree = this.$project.design.tree;
		const { n1, n2 } = e;
		const edge = tree.$edges.get(n1, n2);
		if(!edge) return;
		const river = new River(this, edge, graphics);
		this.$rivers.set(n1, n2, river);
		this.$sheet.$addChild(river);
	}

	private _removeRiver(river: River): void {
		this.$sheet.$removeChild(river);
		this.$rivers.delete(river.$edge.$v1.id, river.$edge.$v2.id);
		river.$dispose();
	}

	private _updateStretches(model: UpdateModel): void {
		for(const tag in model.add.stretches) {
			const data = model.add.stretches[tag];
			let stretch = this.$stretches.get(tag);
			if(stretch) {
				this.$project.history.$destruct(stretch.$toMemento());
				stretch.$update(data, model);
			} else {
				stretch = new Stretch(this, data, model);
				this.$stretches.set(tag, stretch);
				this.$sheet.$addChild(stretch);
			}
			this.$project.history.$construct(stretch.$toMemento());
		}
		for(const tag of model.remove.stretches) {
			const stretch = this.$stretches.get(tag);
			if(!stretch) continue;
			this.$project.history.$destruct(stretch.$toMemento());
			this.$stretches.delete(tag);
			this.$sheet.$removeChild(stretch);
			stretch.$dispose();
		}
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

	private _updateJunctions(model: UpdateModel): number {
		const junctionLayer = this.$sheet.$layers[Layer.$junction];
		const max = ProjectService.scale.value;
		this._scale = max;
		let delta = 0;
		for(const tag in model.add.junctions) {
			let junction = this.$junctions.get(tag);
			if(!junction) {
				junction = new Junction(model.add.junctions[tag]);
				this.$junctions.set(tag, junction);
				junctionLayer.addChild(junction);
				delta++;
			} else {
				junction.$polygon = model.add.junctions[tag];
			}
			junction.$draw(max);
		}
		for(const tag of model.remove.junctions) {
			const junction = this.$junctions.get(tag)!;
			delta--;
			this.$junctions.delete(tag);
			junctionLayer.removeChild(junction);
			junction.destroy();
		}
		return delta;
	}

	/** Redraw the junctions when scale changes */
	private _redrawJunctions(): void {
		const max = ProjectService.scale.value;
		if(this._scale == max) return;
		this._scale = max;
		for(const junction of this.$junctions.values()) junction.$draw(max);
	}
}

/**
 * The current {@link Promise} for flap updating process.
 */
let flapUpdatePromise: Promise<void> | undefined;
