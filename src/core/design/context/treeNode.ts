import { AABB } from "./aabb/aabb";
import { MutableHeap } from "shared/data/heap/mutableHeap";
import { State } from "core/service/state";

import type { Contour, Polygon } from "shared/types/geometry";
import type { JEdge, JFlap } from "shared/json";
import type { ITreeNode } from ".";
import type { Tree } from "./tree";

//=================================================================
/**
 * {@link TreeNode} is a node on the {@link Tree}.
 * For a non-root, it also stores information about its parent edge.
 */
//=================================================================

export class TreeNode implements ITreeNode {

	/** The id of the node. */
	public readonly id: number;

	public $parent: TreeNode | undefined;

	/** The distance from the node to the root. */
	public $dist: number = 0;

	/**
	 * The branch height under the node (0 for a leaf).
	 *
	 * We set the initial value to -1, so that changing is triggered on construction.
	 */
	public $height: number = -1;

	/** The AABB corresponding to the node and its parent edge. */
	public readonly $AABB: AABB = new AABB();

	/** All child nodes. Implemented using maximal heap. */
	public $children = new MutableHeap<TreeNode>((a, b) => b.$height - a.$height);

	/** The contours without considering patterns. */
	public $roughContours!: Contour[];

	/** The final contours. */
	public $contours!: Contour[];

	/** The length of its parent edge. */
	public $length: number = 0;

	constructor(id: number, parent?: TreeNode, length: number = 0) {
		this.id = id;
		State.$childrenChanged.add(this);
		State.$updateResult.add.nodes.push(id);
		if(parent) {
			this.$length = length;
			this.$AABB.$setMargin(length);
			this.$pasteTo(parent);
			this.$dist = parent.$dist + length;
		}
	}

	public toJSON(): JEdge {
		if(!this.$parent) throw new Error("Cannot export root node");
		return { n1: this.$parent.id, n2: this.id, length: this.$length };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $setFlap(flap: JFlap): void {
		this.$setAABB(flap.y + flap.height, flap.x + flap.width, flap.y, flap.x);
	}

	/** For testing purpose. */
	public $setAABB(top: number, right: number, bottom: number, left: number): void {
		State.$flapAABBChanged.add(this);
		this.$AABB.$update(top, right, bottom, left);
	}

	/** Removes self if self is leaf, and returns whether the operation is successful. */
	public $remove(): boolean {
		const parent = this.$parent;
		if(this.$children.$get() || !parent) return false;
		this.$cut();
		return true;
	}

	public $pasteTo(parent: TreeNode, skipProcess?: boolean): void {
		this.$parent = parent;
		parent.$children.$insert(this);
		State.$parentChanged.add(this);
		if(!skipProcess) {
			State.$updateResult.add.edges.push({ n1: this.id, n2: parent.id, length: this.$length });
		}
	}

	/** Temporarily disconnects a node from the tree, without changing its subtree. */
	public $cut(skipProcess?: boolean): void {
		if(this.$parent) {
			this.$parent.$children.$remove(this);
			State.$childrenChanged.add(this.$parent);
			if(!skipProcess) State.$updateResult.remove.edges.push({ n1: this.id, n2: this.$parent.id });
		}
		this.$parent = undefined;
	}

	public get $isLeaf(): boolean {
		return this.$children.$isEmpty;
	}

	/** The tag used for identifying objects in API. */
	public get $tag(): string {
		if(this.$isLeaf) return "f" + this.id;
		const pid = this.$parent!.id;
		if(this.id < pid) return `re${this.id},${pid}`;
		else return `re${pid},${this.id}`;
	}
}
