import { getOrSetEmptyArray } from "shared/utils/map";

import type { UpdateRequest } from "core/controller/designController";
import type { JEdge } from "shared/json/tree";
import type { CoreManager } from "./coreManager";
import type { Flap } from "./components/layout/flap";
import type { Edge } from "./components/tree/edge";

//=================================================================
/**
 * {@link BatchUpdateManager} controls batch update of flaps and edges.
 * This is one rather complicated part of the architecture.
 * There are two issues we're solving here:
 *
 * 1. The user could manipulate multiple flaps and even edges in one operation.
 * 2. The user could very rapidly trigger changes, say during dragging.
 *
 * To handle the first issue, we use {@link _updatePromise} to wait until
 * all objects are manipulated, and then we process them all in {@link _flush}.
 * For the second issue, we use a {@link CoreManager} to control the callings.
 */
//=================================================================
export class BatchUpdateManager {
	/** The flaps that are about to be updated, and their update actions. */
	private readonly _pendingFlaps = new Map<Flap, Action[]>();

	/** The current {@link Promise} for flap updating process. */
	private _updatePromise: Promise<void> | undefined;

	private readonly _pendingEdges: JEdge[] = [];

	private readonly _core: CoreManager;

	constructor(core: CoreManager) {
		this._core = core;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Register an update operation for a {@link Flap}. */
	public $addFlap(flap: Flap, action: Action): Promise<void> {
		getOrSetEmptyArray(this._pendingFlaps, flap).push(action);
		return this._setupPromise();
	}

	/** Register an update for an {@link Edge}. */
	public $addEdge(edge: JEdge): Promise<void> {
		this._pendingEdges.push(edge);
		return this._setupPromise();
	}

	/** Return a {@link Promise} that resolves when all updates are completed. */
	public get $updateComplete(): Promise<void> {
		return (this._updatePromise || Promise.resolve()).then(() => this._core.$updating);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _setupPromise(): Promise<void> {
		if(this._updatePromise === undefined) {
			this._updatePromise = this._core.$prepare().then(() => this._flush());
		}
		return this._updatePromise;
	}

	private _flush(): Promise<void> {
		const project = this._core.$project;
		this._updatePromise = undefined;
		const request: UpdateRequest = {
			flaps: [],
			edges: this._pendingEdges.concat(),
			dragging: project.$isDragging,
			stretches: project.design.$prototype.layout.stretches,
		};
		for(const [f, actions] of this._pendingFlaps) {
			request.flaps.push(f.$updateDrawParams());
			for(const action of actions) action();
		}
		this._pendingFlaps.clear();
		this._pendingEdges.length = 0;
		return this._core.$run(c => c.design.update(request));
	};
}
