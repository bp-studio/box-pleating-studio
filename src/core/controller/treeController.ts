import { distanceTask } from "core/design/tasks/distance";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";

import type { JEdge, JEdgeBase, JFlap } from "shared/json";

//=================================================================
/**
 * {@link TreeController} manages the operations on the tree structure.
 */
//=================================================================
export namespace TreeController {

	/** Add a new leaf */
	export function addLeaf(id: number, at: number, length: number, flap: JFlap): void {
		const node = State.$tree.$addLeaf(id, at, length);
		node.$setFlap(flap);
		Processor.$run(heightTask);
	}

	/**
	 * Delete leaves one by one.
	 * @param ids The node ids that should be deleted. Must be in correct ordering.
	 * @param prototypes The {@link JFlap}s corresponding to the new leaves after deletion.
	 */
	export function removeLeaf(ids: number[], prototypes: JFlap[]): void {
		const tree = State.$tree;
		for(const id of ids) tree.$removeLeaf(id);
		tree.$setFlaps(prototypes);
		Processor.$run(heightTask);
	}

	export function update(edges: JEdge[]): void {
		const tree = State.$tree;
		for(const e of edges) {
			tree.$setLength(getChildId(e), e.length);
		}
		Processor.$run(distanceTask);
	}

	export function join(id: number): void {
		State.$tree.$join(id);
		Processor.$run(heightTask);
	}

	export function split(edge: JEdgeBase, id: number): void {
		State.$tree.$split(id, getChildId(edge));
		Processor.$run(heightTask);
	}

	export function merge(edge: JEdgeBase): void {
		State.$tree.$merge(getChildId(edge));
		Processor.$run(heightTask);
	}

	/** For a given edge, returns the {@link ITreeNode.id id} of the node that is the child */
	function getChildId(edge: JEdgeBase): number {
		const tree = State.$tree;
		const n1 = tree.$nodes[edge.n1]!, n2 = tree.$nodes[edge.n2]!;
		return n1.$parent === n2 ? edge.n1 : edge.n2;
	}
}
