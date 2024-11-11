import { AreaNode } from "./areaNode";
import { maxDistComparator } from "../treeNode";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { collectPartialTree, getArea, getDistMap } from "./utils";

import type { Hierarchy, ParentMap } from "./utils";
import type { NodeCollection } from "..";
import type { TreeNode } from "../treeNode";
import type { Tree } from "../tree";

//=================================================================
/**
 * The {@link AreaTree} is a special type of tree used for generating
 * the {@link Hierarchy} used in optimizations. Essentially, it simplify
 * complicated branches into single flaps with comparable areas,
 * so that the optimizer can focus on large structures first,
 * and then progressively refine the layout.
 */
//=================================================================
export class AreaTree {

	private readonly _nodes: (AreaNode | undefined)[];
	private _root: AreaNode;
	private _nodeCount = 0;

	constructor(tree: Tree, useDimension: boolean) {
		this._nodes = new Array(tree.$nodes.length);
		this._root = this._build(tree, useDimension);
		this._climb();
		this._balance();
	}

	public get $nodes(): NodeCollection<AreaNode> {
		return this._nodes;
	}

	public get $root(): AreaNode {
		return this._root;
	}

	public $createHierarchy(): Hierarchy[] {
		const currentPartialTree = collectPartialTree(this._root);
		const result: Hierarchy[] = [];
		result.push({
			leaves: currentPartialTree.leaves.map(n => n.id),
			distMap: getDistMap(currentPartialTree),
			parents: [],
		});

		while(currentPartialTree.nodes.length < this._nodeCount) {
			const newLeaves: AreaNode[] = [];
			const parents: ParentMap[] = [];
			for(const leaf of currentPartialTree.leaves) {
				if(leaf.$isLeaf) {
					newLeaves.push(leaf);
				} else {
					const subHierarchy = collectPartialTree(leaf);
					subHierarchy.nodes.shift();
					parents.push({
						id: leaf.id,
						radius: Math.sqrt(leaf.$area),
						children: subHierarchy.nodes.map(n => n.id),
					});
					currentPartialTree.nodes.push(...subHierarchy.nodes);
					newLeaves.push(...subHierarchy.leaves);
				}
			}
			currentPartialTree.leaves = newLeaves;
			result.push({
				leaves: currentPartialTree.leaves.map(n => n.id),
				distMap: getDistMap(currentPartialTree),
				parents,
			});
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _build(tree: Tree, useDimension: boolean): AreaNode {
		const queue: TreeNode[] = [tree.$root];
		let root: AreaNode;
		while(queue.length) {
			let node = queue.shift()!;
			let length = node.$length;
			const parent = node.$parent && this._nodes[node.$parent.id];

			// Simplify tree
			while(node.$children.$size == 1) {
				node = node.$children.$get()!;
				length += node.$length;
			}

			const area = getArea(node, length, useDimension);
			const aNode = new AreaNode(node.id, length, parent, area);
			this._nodeCount++;
			this._nodes[node.id] = aNode;
			if(!node.$parent) root = aNode;
			for(const child of node.$children) queue.push(child);
		}
		return root!;
	}

	/** Climb the tree bottom-up, and update the critical data. */
	private _climb(): void {
		const heap = new BinaryHeap<AreaNode>(maxDistComparator);
		for(const node of this._nodes) {
			if(node && node.$isLeaf) heap.$insert(node);
		}
		while(!heap.$isEmpty) {
			const node = heap.$pop()!;
			node.$update();
			if(node.$parent) heap.$insert(node.$parent);
		}
	}

	/**
	 * Balance the tree based on branch areas.
	 * The resulting root node could be different from the original tree,
	 * which was balanced by branch heights.
	 */
	private _balance(): void {
		while(true) {
			const firstChild = this._root.$children.$get()!;

			if(firstChild.$children.$size == 0) return;
			const nextFirstChildArea = firstChild.$children.$get()!.$area;
			let nextRestArea = 0;
			for(const child of this._root.$children) {
				if(child != firstChild) nextRestArea += child.$area;
			}
			const radius = Math.sqrt(nextRestArea) + firstChild.$length;
			nextRestArea = radius * radius;
			if(nextFirstChildArea <= nextRestArea) return;

			const oldRoot = this._root;
			this._root = firstChild;
			oldRoot.$children.$remove(firstChild);
			oldRoot.$update();
			firstChild.$parent = undefined;
			const length = firstChild.$length;
			firstChild.$dist = firstChild.$length = 0;
			firstChild.$children.$insert(oldRoot);
			oldRoot.$parent = firstChild;
			oldRoot.$dist = oldRoot.$length = length;
		}
	}
}
