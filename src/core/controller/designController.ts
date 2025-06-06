import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Tree } from "core/design/context/tree";
import { setStretchPrototypes } from "core/design/tasks/stretch";
import { getChildId } from "./treeController";
import { structureTask } from "core/design/tasks/structure";
import { AABBTask } from "core/design/tasks/aabb";

import type { JDesign, JEdge, JFlap, JStretch } from "shared/json";

export interface UpdateRequest {
	flaps: JFlap[];
	edges: JEdge[];
	stretches: JStretch[];
	dragging: boolean;
}

//=================================================================
/**
 * {@link DesignController} manages operation related to the whole design.
 */
//=================================================================
export namespace DesignController {

	/** Initialize a design by the given data. */
	export function init(data: JDesign): void {
		/// #if DEBUG
		/* istanbul ignore next: debug */
		console.time("Design initializing");
		/// #endif

		State.m.$tree = new Tree(data.tree.edges, data.layout.flaps);
		State.m.$treeStructureChanged = true;
		State.m.$rootChanged = true;
		for(const s of data.layout.stretches) {
			State.$stretchPrototypes.set(s.id, s);
		}
		Processor.$run(heightTask);

		/// #if DEBUG
		/* istanbul ignore next: debug */
		console.timeEnd("Design initializing");
		/// #endif
	}

	/**
	 * Perform batch update for flaps and edges.
	 */
	export function update(request: UpdateRequest): void {
		State.m.$isDragging = request.dragging;
		State.m.$tree.$setFlaps(request.flaps);
		for(const e of request.edges) {
			State.m.$tree.$setLength(getChildId(e), e.length);
		}
		setStretchPrototypes(request.stretches);
		Processor.$run(request.edges.length ? structureTask : AABBTask);
	}
}
