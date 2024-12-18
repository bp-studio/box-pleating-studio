import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { balanceTask } from "core/design/tasks/balance";
import { setStretchPrototypes } from "core/design/tasks/stretch";
import { distMap } from "core/design/context/treeUtils";
import { AreaTree } from "core/design/context/areaTree/areaTree";

import type { Hierarchy } from "core/design/context/areaTree/utils";
import type { JEdgeBase, JEdit, JFlap, JStretch, NodeId } from "shared/json";
import type { TreeNode } from "core/design/context/treeNode";

//=================================================================
/**
 * {@link TreeController} manages the operations on the tree structure.
 */
//=================================================================
export namespace TreeController {

	/**
	 * Batch perform tree editing. Used in history navigation.
	 * @param rootId: The {@link TreeNode.id} of the expected root.
	 * @param flaps Prototypes {@link JFlap}s for newly created leaves.
	 * @param stretches Prototype {@link JStretch}s for newly created stretches.
	 */
	export function edit(edits: JEdit[], rootId: NodeId, flaps: JFlap[], stretches: JStretch[]): void {
		const tree = State.$tree;
		for(const e of edits) {
			if(e[0]) tree.$addEdge(e[1].n1, e[1].n2, e[1].length);
			else tree.$removeEdge(e[1].n1, e[1].n2);
		}
		tree.$flushRemove();
		tree.$setFlaps(flaps);
		setStretchPrototypes(stretches);
		balanceTask.data = rootId;
		Processor.$run(heightTask);
	}

	/** Add a new leaf. */
	export function addLeaf(id: NodeId, at: NodeId, length: number, flap: JFlap): void {
		const node = State.$tree.$addEdge(id, at, length);
		node.$setFlap(flap);
		Processor.$run(heightTask);
	}

	/**
	 * Delete leaves one by one.
	 * @param ids The node ids that should be deleted. Must be in correct ordering.
	 * @param prototypes The {@link JFlap}s corresponding to the new leaves after deletion.
	 */
	export function removeLeaf(ids: NodeId[], prototypes: JFlap[]): void {
		const tree = State.$tree;
		for(const id of ids) tree.$removeLeaf(id);
		tree.$flushRemove();
		tree.$setFlaps(prototypes);
		Processor.$run(heightTask);
	}

	export function join(id: NodeId): void {
		State.$tree.$join(id);
		Processor.$run(heightTask);
	}

	export function split(edge: JEdgeBase, id: NodeId): void {
		State.$tree.$split(id, getChildId(edge));
		Processor.$run(heightTask);
	}

	export function merge(edge: JEdgeBase): void {
		State.$tree.$merge(getChildId(edge));
		Processor.$run(heightTask);
	}

	export function getHierarchy(random: boolean, useDimension: boolean): Hierarchy[] {
		if(!random) {
			return [{
				leaves: State.$tree.$nodes.filter(n => n && n.$isLeaf).map(n => n!.id),
				distMap: distMap(State.$tree.$nodes),
				parents: [],
			}];
		}
		const aTree = new AreaTree(State.$tree, useDimension);
		return aTree.$createHierarchy();
	}
}

/** For a given edge, returns the {@link ITreeNode.id id} of the node that is the child */
export function getChildId(edge: JEdgeBase): NodeId {
	const tree = State.$tree;
	const n1 = tree.$nodes[edge.n1]!, n2 = tree.$nodes[edge.n2]!;
	return n1.$parent === n2 ? edge.n1 : edge.n2;
}
