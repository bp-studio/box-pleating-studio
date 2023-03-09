import { Design } from "core/design/design";
import { distanceTask } from "core/design/tasks/distance";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";

import type { JEdge, JEdgeBase, JFlap } from "shared/json";

//=================================================================
/**
 * {@link TreeController} manages the operations on the tree structure.
 */
//=================================================================
namespace TreeController {

	/** Add a new leaf */
	export function addLeaf(id: number, at: number, length: number, flap: JFlap): void {
		const tree = Design.$instance.$tree;
		const node = tree.$addLeaf(id, at, length);
		node.$setFlap(flap);
		Processor.$run(heightTask);
	}

	/**
	 * Delete leaves one by one
	 * @param ids The node ids that should be deleted.
	 * @param prototypes The {@link JFlap}s corresponding to the new leaves after deletion.
	 */
	export function removeLeaf(ids: number[], prototypes: JFlap[]): void {
		const tree = Design.$instance.$tree;
		while(ids.length) {
			const nodes = ids.map(id => tree.$nodes[id]!);
			ids.length = 0;
			nodes.sort((a, b) => b.$dist - a.$dist);
			for(const node of nodes) {
				if(!tree.$removeLeaf(node.id)) ids.push(node.id);
			}

			if(ids.length) {
				// If we enter here, it means that the requested deletion covers the current tree root,
				// and we can only perform the full update and then continue.
				// Although this is not the optimal solution in terms of performance,
				// such requests are almost never encountered in practice.
				// This block of code is mainly added for correctness in theory.
				// Additionally, this process may cause some garbage data to be inserted into the updated model,
				// which the Client needs to be aware of.
				Processor.$run(heightTask);
			}
		}

		tree.$setFlaps(prototypes);
		Processor.$run(heightTask);
	}

	export function update(edges: JEdge[]): void {
		const tree = Design.$instance.$tree;
		for(const e of edges) {
			tree.$setLength(getChildId(e), e.length);
		}
		Processor.$run(distanceTask);
	}

	export function join(id: number): void {
		Design.$instance.$tree.$join(id);
		Processor.$run(heightTask);
	}

	export function split(edge: JEdgeBase, id: number): void {
		Design.$instance.$tree.$split(id, getChildId(edge));
		Processor.$run(heightTask);
	}

	export function merge(edge: JEdgeBase): void {
		Design.$instance.$tree.$merge(getChildId(edge));
		Processor.$run(heightTask);
	}

	/** For a given edge, returns the {@link ITreeNode.id id} of the node that is the child */
	function getChildId(edge: JEdgeBase): number {
		const tree = Design.$instance.$tree;
		const n1 = tree.$nodes[edge.n1]!, n2 = tree.$nodes[edge.n2]!;
		return n1.$parent === n2 ? edge.n1 : edge.n2;
	}
}

export default TreeController;
