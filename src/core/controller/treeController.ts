import { Design } from "core/design/design";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";

import type { JEdge, JEdgeBase, JFlap } from "shared/json";

//=================================================================
/**
 * {@link TreeController} 模組是管理樹狀結構的操作。
 */
//=================================================================
namespace TreeController {

	export function addLeaf(id: number, at: number, length: number, flap: JFlap): void {
		const tree = Design.$instance.$tree;
		const node = tree.$addLeaf(id, at, length);
		node.$setFlap(flap);
		Processor.$run(heightTask);
	}

	export function removeLeaf(ids: number[]): void {
		const tree = Design.$instance.$tree;
		const nodes = ids.map(id => tree.$nodes[id]!);
		nodes.sort((a, b) => b.$dist - a.$dist);
		for(const node of nodes) tree.$removeLeaf(node.id);
		Processor.$run(heightTask);
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

	export function json(): JEdge[] {
		return Design.$instance.$tree.toJSON();
	}

	/** 對於傳入的邊，傳回其中是子點的那一個的 {@link ITreeNode.id id} */
	function getChildId(edge: JEdgeBase): number {
		const tree = Design.$instance.$tree;
		const n1 = tree.$nodes[edge.n1]!, n2 = tree.$nodes[edge.n2]!;
		return n1.$parent === n2 ? edge.n1 : edge.n2;
	}
}

export default TreeController;
