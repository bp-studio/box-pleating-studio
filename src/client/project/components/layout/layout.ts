
import { AlphaFilter } from "@pixi/filter-alpha";

import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { shallowRef } from "client/shared/decorators";
import { River } from "./river";
import { Sheet, getRelativePoint } from "../sheet";
import { Layer } from "client/shared/layers";
import { Junction } from "./junction";
import ProjectService from "client/services/projectService";
import { View } from "client/base/view";
import { style } from "client/services/styleService";
import { Stretch } from "./stretch";
import { FlapContainer } from "./flapContainer";
import { applyTransform } from "shared/types/geometry";

import type { IEditor } from "../sheet";
import type { TransformationMatrix } from "shared/types/geometry";
import type { Flap } from "./flap";
import type { BatchUpdateManager } from "client/project/batchUpdateManager";
import type { Device } from "./device";
import type { Container } from "@pixi/display";
import type { Project } from "client/project/project";
import type { GraphicsData, UpdateModel } from "core/service/updateModel";
import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { JEdge, JEdgeBase, JFlap, JLayout, JSheet, JStretch, JViewport, NodeId } from "shared/json";

//=================================================================
/**
 * {@link Layout} manages the operations and logics in the layout view.
 *
 * Itself is also derived from {@link View},
 * as it handles the drawing of invalid junctions.
 */
//=================================================================
export class Layout extends View implements ISerializable<JLayout>, IEditor {

	@shallowRef public accessor flapCount: number = 0;
	@shallowRef public accessor riverCount: number = 0;
	@shallowRef public accessor invalidCount: number = 0;
	@shallowRef public accessor patternNotFound: boolean = false;

	public readonly $project: Project;
	public readonly $sheet: Sheet;
	public readonly $flaps: FlapContainer;
	public readonly $rivers: IDoubleMap<NodeId, River> = new ValuedIntDoubleMap();
	public readonly $junctions: Map<string, Junction> = new Map();
	public readonly $stretches: Map<string, Stretch> = new Map();

	private _deviceMovePromise: Promise<void> | undefined;
	private _draggingDevice: Device | undefined;
	private _draggingDeviceAction: Action | undefined;

	/** Cached value of scale. */
	private _scale: number = 0;

	/** Cached value of junction color. */
	private _junctionColor: number = 0;

	constructor(project: Project, parentView: Container, json: JSheet, state?: JViewport) {
		super();
		this.$project = project;
		this.$flaps = new FlapContainer(this);
		this.$sheet = new Sheet(project, parentView, "layout", this, json, state);
		this.$sheet.$addChild(this);

		const filter = new AlphaFilter(style.junction.alpha);
		this.$sheet.$layers[Layer.junction].filters = [filter];

		this.$reactDraw(this._redrawJunctions);
	}

	public toJSON(session?: true): JLayout {
		return {
			sheet: this.$sheet.toJSON(),
			flaps: [...this.$flaps].map(f => f.toJSON()),
			stretches: [...this.$stretches.values()].map(s => s.toJSON(session)),
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
		this.$flaps.$batchRemove(model, newRivers);
		for(const r of this.$rivers.values()) {
			const v = r.$edge.$getLeaf();
			if(v) this._removeRiver(r); // A river turns into a flap
		}
		this.patternNotFound = model.patternNotFound;

		for(const f of prototype.layout.flaps) {
			this.$flaps.$add(f, model.graphics["f" + f.id]);
		}
		prototype.layout.flaps.length = 0;
		this.flapCount = this.$flaps.size;

		for(const r of newRivers) {
			const edge = tree.$edges.get(r.n1, r.n2)!;
			if(edge.$v1.isLeaf || edge.$v2.isLeaf) continue;
			const tag = getEdgeTag(r);
			if(!model.graphics[tag]) continue;
			this._addRiver(r, model.graphics[tag]);
		}
		this.riverCount = this.$rivers.size;
	}

	/**
	 * Remove rivers that no longer exist.
	 * We separate this method for the execution order.
	 */
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

	public $switchConfig(stretchId: string, to: number): Promise<void> {
		return this.$project.$core.layout.switchConfig(stretchId, to);
	}

	public $switchPattern(stretchId: string, to: number): Promise<void> {
		return this.$project.$core.layout.switchPattern(stretchId, to);
	}

	public $completeStretch(stretchId: string): Promise<JStretch | null> {
		return this.$project.$core.layout.completeStretch(stretchId);
	}

	/**
	 * Similar to {@link BatchUpdateManager}, dragging of {@link Device} can also fire rapidly,
	 * and we use the same mechanism to control the callings to the Core.
	 */
	public $moveDevice(device: Device, action: Action): Promise<void> {
		this._draggingDeviceAction = action;
		if(this._deviceMovePromise === undefined) {
			this._draggingDevice = device;
			const prepare = this.$project.design.$coreManager.$prepare();
			this._deviceMovePromise = prepare.then(() => this._flushDeviceMove());
		}
		return this._deviceMovePromise;
	}

	public $endDeviceDrag(): void {
		if(this._draggingDevice) this._draggingDevice.$dragEnd();
		this._draggingDevice = undefined;
	}

	public $createFlapPrototype(id: NodeId, vertexLocation: IPoint): JFlap {
		const { x, y } = getRelativePoint(vertexLocation, this.$project.design.tree.$sheet, this.$sheet);
		return { id, x, y, width: 0, height: 0 };
	}

	public $transform(matrix: TransformationMatrix): void {
		const [a, b, c, d] = matrix;
		const scale = Math.round((Math.sqrt(a * a + c * c) + Math.sqrt(b * b + d * d)) / 2);
		for(const flap of this.$flaps) {
			const { x, y, width, height } = flap.toJSON();
			const ll = applyTransform({ x, y }, matrix);
			const ur = applyTransform({ x: x + width, y: y + height }, matrix);
			const newX = Math.min(ur.x, ll.x);
			const newY = Math.min(ur.y, ll.y);
			const newWidth = Math.abs(ur.x - ll.x);
			const newHeight = Math.abs(ur.y - ll.y);
			flap.$manipulate(newX, newY, newWidth, newHeight);
			if(scale != 1) flap.radius *= scale;
		}
		if(scale == 1) return;
		for(const river of this.$rivers.values()) {
			river.$edge.length *= scale;
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _flushDeviceMove(): Promise<void> {
		this._deviceMovePromise = undefined;
		this._draggingDeviceAction!();
		this._draggingDeviceAction = undefined;
		const device = this._draggingDevice!;
		return this.$project.design.$coreManager.$run(c =>
			c.layout.moveDevice(device.stretch.id, device.$index, device.$location)
		);
	};

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
		river.$destruct();
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
			stretch.$destruct();
		}
		for(const tag of model.update.stretches) {
			const stretch = this.$stretches.get(tag);
			if(stretch) {
				stretch.$updateGraphics(model);
			}
		}
	}

	private _parseTag(tag: string): Flap | River | void {
		const m = tag.match(/^([a-z]+)(\d+(?:,\d+)*)(?:\.(.+))?$/);
		if(!m) return;
		const init = m[1];
		if(init == "f") return this.$flaps.get(Number(m[2]) as NodeId);
		if(init == "re") {
			const [n1, n2] = m[2].split(",").map(n => Number(n) as NodeId);
			return this.$rivers.get(n1, n2);
		}
	}

	private _updateJunctions(model: UpdateModel): number {
		const junctionLayer = this.$sheet.$layers[Layer.junction];
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
		const color = style.junction.color;
		if(this._scale == max && this._junctionColor == color) return;
		this._scale = max;
		this._junctionColor = color;
		for(const junction of this.$junctions.values()) junction.$draw(max);
	}
}

function getEdgeTag(e: JEdgeBase): string {
	const { n1, n2 } = e;
	return n1 < n2 ? `re${n1},${n2}` : `re${n2},${n1}`;
}
