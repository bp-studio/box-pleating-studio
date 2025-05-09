
import { Flap } from "./flap";

import type { Layout } from "./layout";
import type { GraphicsData, UpdateModel } from "core/service/updateModel";
import type { JFlap, JEdge, NodeId } from "shared/json";

//=================================================================
/**
 * {@link FlapContainer} manages {@link Flap}s.
 * It is separated from {@link Layout} to make things organized.
 */
//=================================================================
export class FlapContainer implements Iterable<Flap> {

	/** The new flaps that should be synced. */
	public readonly $sync = new Map<NodeId, Flap>();

	private readonly _layout: Layout;
	private readonly _flaps: Map<NodeId, Flap> = new Map();

	constructor(layout: Layout) {
		this._layout = layout;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get size(): number {
		return this._flaps.size;
	}

	public get(id: NodeId): Flap | undefined {
		return this._flaps.get(id);
	}

	public [Symbol.iterator](): IterableIterator<Flap> {
		return this._flaps.values();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $add(f: JFlap, graphics: GraphicsData): void {
		if(this._flaps.has(f.id)) {
			// This shouldn't happen, but just in case
			/// #if DEBUG
			debugger;
			/// #endif
			return;
		}

		const project = this._layout.$project;
		const tree = project.design.tree;
		const vertex = tree.$vertices.$get(f.id)!;
		const edge = tree.$getFirstEdge(vertex);
		if(!edge || !graphics) debugger;
		const flap = new Flap(this._layout, f, vertex, edge, graphics);
		this._flaps.set(f.id, flap);
		if(vertex.$isNew) this.$sync.set(f.id, flap);
		this._layout.$sheet.$addChild(flap);
		project.history.$construct(flap.$toMemento());
	}

	public $batchRemove(model: UpdateModel, newRivers: JEdge[]): void {
		const project = this._layout.$project;
		const design = project.design;
		const prototype = design.$prototype;
		const tree = design.tree;
		for(const f of this._flaps.values()) {
			const vertex = tree.$vertices.$get(f.id);
			const edgeDestructed = !f.$edge.$v1; // The original flap is split
			if(!vertex || !vertex.isLeaf || edgeDestructed) {
				if(vertex) {
					if(!edgeDestructed) {
						// A flap turns into a river
						newRivers.push(f.$edge.toJSON());
					} else if(!project.history.$moving) {
						prototype.layout.flaps.push(f.toJSON());
						model.graphics["f" + f.id] ||= f.$graphics;
					}
				}
				this.$remove(f.id);
			}
		}
	}

	public $remove(id: NodeId): void {
		const flap = this._flaps.get(id)!;
		const memento = flap.$toMemento();
		this._layout.$sheet.$removeChild(flap);
		flap.$destruct();
		this._flaps.delete(id);
		this._layout.$project.history.$destruct(memento);
	}
}
