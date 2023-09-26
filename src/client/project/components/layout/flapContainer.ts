
import { Flap } from "./flap";

import type { Layout } from "./layout";
import type { GraphicsData, UpdateModel } from "core/service/updateModel";
import type { JFlap, JEdge } from "shared/json";
import type { CoreManager } from "./coreManager";

//=================================================================
/**
 * {@link FlapContainer} manages {@link Flap}s.
 * It is separated from {@link Layout} to make things organized.
 */
//=================================================================
export class FlapContainer {

	/** The new flaps that should be synced. */
	public readonly $sync = new Map<number, Flap>();

	private readonly _layout: Layout;
	private readonly _flaps: Map<number, Flap> = new Map();

	/** The flaps that are about to be updated, and their update actions. */
	private readonly _pendingUpdate = new Map<Flap, Action>();

	/** The current {@link Promise} for flap updating process. */
	private _flapUpdatePromise: Promise<void> | undefined;

	constructor(layout: Layout) {
		this._layout = layout;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get size(): number {
		return this._flaps.size;
	}

	public get(id: number): Flap | undefined {
		return this._flaps.get(id);
	}

	public [Symbol.iterator](): IterableIterator<Flap> {
		return this._flaps.values();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Register an update operation for a {@link Flap}.
	 *
	 * This is one rather complicated part of the architecture.
	 * There are two issues we're solving here:
	 * 1. The user could manipulate multiple flaps in one operation.
	 * 2. The user could very rapidly trigger changes, say during dragging.
	 * To handle the first issue, we use {@link _flapUpdatePromise} to wait until
	 * all flaps are manipulated, and then we process them all in {@link _flushUpdate}.
	 * For the second issue, we use a {@link CoreManager} to control the callings.
	 */
	public $update(flap: Flap, action: Action): Promise<void> {
		this._pendingUpdate.set(flap, action);
		if(this._flapUpdatePromise === undefined) {
			this._flapUpdatePromise = this._layout.$core.$prepare().then(this._flushUpdate);
		}
		return this._flapUpdatePromise;
	}

	public get $flapUpdatePromise(): Promise<void> | undefined {
		return this._flapUpdatePromise;
	}

	public $add(f: JFlap, graphics: GraphicsData): void {
		if(this._flaps.has(f.id)) {
			// This shouldn't happen, but just in case
			debugger;
			return;
		}

		const project = this._layout.$project;
		const tree = project.design.tree;
		const vertex = tree.$vertices[f.id]!;
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
			const vertex = tree.$vertices[f.id];
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

	public $remove(id: number): void {
		const flap = this._flaps.get(id)!;
		const memento = flap.$toMemento();
		this._layout.$sheet.$removeChild(flap);
		flap.$destruct();
		this._flaps.delete(id);
		this._layout.$project.history.$destruct(memento);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private readonly _flushUpdate = (): Promise<void> => {
		const project = this._layout.$project;
		this._flapUpdatePromise = undefined;
		const flaps: JFlap[] = [];
		for(const [f, action] of this._pendingUpdate) {
			flaps.push(f.$updateDrawParams());
			action();
		}
		this._pendingUpdate.clear();
		const dragging = project.$isDragging;
		const prototypes = project.design.$prototype.layout.stretches;
		return this._layout.$core.$run(() =>
			project.$core.layout.updateFlap(flaps, dragging, prototypes)
		);
	};
}
