import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { maxDistComparator } from "./treeNode";
import { getOrSetEmptyArray } from "shared/utils/map";

import type { ITreeNode, ITree, ITreeNodeBase, NodeCollection } from ".";
import type { NodeId } from "shared/json/tree";

/**
 * Each entry represents a pair of leaves and the tree distance between them.
 * For `n` leaves, it will have exactly `n * (n - 1) / 2` entries.
 */
export type DistMap<T = NodeId> = [T, T, number][];

/** Create a record for the distances between all leaf-pairs. */
export function distMap(nodes: NodeCollection<ITreeNodeBase>): DistMap {
	const heap = new BinaryHeap(maxDistComparator);
	const coverages = new Map<ITreeNodeBase, ITreeNodeBase[]>();
	for(const node of nodes) {
		if(node && node.$isLeaf) {
			heap.$insert(node);
			coverages.set(node, [node]);
		}
	}

	const result: DistMap = [];
	while(!heap.$isEmpty) {
		const node = heap.$pop()!;
		const coverage = coverages.get(node)!;
		const parent = node.$parent;
		if(!parent) break;
		const parentCoverage = getOrSetEmptyArray(coverages, parent, () => heap.$insert(parent));
		for(const A of parentCoverage) {
			for(const B of coverage) {
				result.push([A.id, B.id, dist(A, B, parent)]);
			}
		}
		parentCoverage.push(...coverage);
	}
	return result;
}

/** Return the structural distance between two {@link ITreeNode}s using LCA. */
export function dist(a: ITreeNodeBase, b: ITreeNodeBase, lca: ITreeNodeBase): number {
	return a.$dist + b.$dist - 2 * lca.$dist;
}

/**
 * Return the structural distance between two nodes without supplying LCA. Used only in unit tests.
 */
export function getDist(n1: ITreeNode, n2: ITreeNode): number {
	return dist(n1, n2, getLCA(n1, n2));
}

/**
 * Returns the LCA of two nodes. Used only in unit tests.
 */
function getLCA(n1: ITreeNode, n2: ITreeNode): ITreeNode {
	while(n1 !== n2) {
		// Originally this part compares the depths of the nodes,
		// but in fact comparing the distance results the same,
		// and we save ourselves the overhead of maintaining one extra field.
		if(n1.$dist >= n2.$dist) n1 = n1.$parent!;
		if(n2.$dist > n1.$dist) n2 = n2.$parent!;
	}
	return n1;
}
