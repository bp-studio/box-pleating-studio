import { AreaNode } from "./areaNode";
import { distMap } from "../treeUtils";
import { BinaryHeap } from "shared/data/heap/binaryHeap";

import type { DistMap } from "../treeUtils";
import type { NodeId } from "shared/json/tree";
import type { Comparator } from "shared/types/types";
import type { TreeNode } from "../treeNode";

const MIN_HIERARCHY_LEAVES = 5;
const maxChildrenComparator: Comparator<AreaNode> = (a, b) => b.$children.$size - a.$children.$size;

export interface ParentMap {
	id: NodeId;
	radius: number;
	children: NodeId[];
}

export interface Hierarchy {
	leaves: NodeId[];
	distMap: DistMap;
	parents: ParentMap[];
}

/** A {@link PartialTree} is a subset of the original tree with the same root. */
interface PartialTree {
	/** All nodes in the current {@link PartialTree}. */
	nodes: AreaNode[];

	/** All leaves in the current {@link PartialTree} (which may not be leaves in the original tree). */
	leaves: AreaNode[];
}

/**
 * Return the area (ignoring the factor of PI) of a flap.
 * We ignore the PI part because it is not critical to the rest of the computation.
 */
export function getArea(node: TreeNode, radius: number, useDimension: boolean): number {
	const baseArea = radius * radius;
	if(!useDimension) return baseArea;
	const [t, r, b, l] = node.$AABB.$toValues();
	const width = r - l, height = t - b;
	return (width * height + (width + height) * radius) / Math.PI + baseArea;
}

/**
 * Collect a {@link PartialTree} from a given root node,
 * until we have a tree with at least {@link MIN_HIERARCHY_LEAVES} leaves.
 */
export function collectPartialTree(root: AreaNode): PartialTree {
	const result = [root];
	const leafHeap = new BinaryHeap(maxChildrenComparator);
	leafHeap.$insert(root);
	while(leafHeap.$size < MIN_HIERARCHY_LEAVES && !leafHeap.$get()!.$isLeaf) {
		const parent = leafHeap.$pop()!;
		for(const child of parent.$children) {
			leafHeap.$insert(child);
			result.push(child);
		}
	}
	return {
		nodes: result,
		leaves: [...leafHeap],
	};
}

export function getDistMap(data: PartialTree): DistMap {
	const leaves = new Set(data.leaves);
	const result: AreaNode[] = [];
	for(const node of data.nodes) {
		const id = node.id;
		const length = leaves.has(node) ? Math.sqrt(node.$area) : node.$length;
		result[id] = new AreaNode(id, length, node.$parent && result[node.$parent.id]);
	}
	return distMap(result);
}
