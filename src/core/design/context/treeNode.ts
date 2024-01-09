import { AABB } from "./aabb/aabb";
import { MutableHeap } from "shared/data/heap/mutableHeap";
import { State } from "core/service/state";

import type { JNode } from "core/service/updateModel";
import type { Comparator } from "shared/types/types";
import type { JEdge, JFlap } from "shared/json";
import type { ITreeNode, NodeGraphics } from ".";
import type { NodeId } from "shared/json/tree";
import type { Tree } from "./tree";

export const nodeComparator: Comparator<ITreeNode> = (a, b) => b.$dist - a.$dist;

//=================================================================
/**
 * {@link TreeNode} is a node on the {@link Tree}.
 * For a non-root, it also stores information about its parent edge.
 *
 * Whenever possible, do not use this type directly,
 * and use the readonly {@link ITreeNode} interface instead.
 */
//=================================================================

export class TreeNode implements ITreeNode {

	/** The id of the node. */
	public readonly id: NodeId;

	public $parent: this | undefined;

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

	public _leafList!: TreeNode[];

	public readonly $graphics: NodeGraphics = {
		$contours: [],
		$patternContours: [],
		$traceContours: [],
		$roughContours: [],
		$ridges: [],
	};

	/** The length of its parent edge. */
	public $length: number = 0;

	constructor(id: NodeId, parent?: TreeNode, length: number = 0) {
		this.id = id;
		State.$childrenChanged.add(this);
		State.$updateResult.add.nodes.push(id);
		if(parent) {
			this.$length = length;
			this.$AABB.$setMargin(length);
			this.$pasteTo(parent as this);
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

	public get $leaves(): readonly TreeNode[] {
		return this._leafList;
	}

	public get $data(): JNode {
		return {
			id: this.id,
			dist: this.$dist,
			height: this.$height,
		};
	}

	public $updateLeaves(): void {
		if(this.$isLeaf) {
			this._leafList = [this];
		} else {
			this._leafList = [];
			for(const child of this.$children) {
				this._leafList.push(...child._leafList);
			}
		}
	}

	public $setFlap(flap: JFlap): void {
		this.$setAABB(flap.y + flap.height, flap.x + flap.width, flap.y, flap.x);
	}

	/** For testing purpose. */
	public $setAABB(top: number, right: number, bottom: number, left: number): void {
		State.$nodeAABBChanged.add(this);
		this.$AABB.$update(top, right, bottom, left);
	}

	public $pasteTo(parent: this): void {
		this.$parent = parent;
		parent.$children.$insert(this);
		State.$parentChanged.add(this);
		State.$childrenChanged.add(parent);
	}

	/**
	 * Temporarily disconnects a node from the tree, without changing its subtree.
	 */
	public $cut(): void {
		if(this.$parent) {
			this.$parent.$children.$remove(this);
			if(this.$parent.$AABB.$removeChild(this.$AABB)) {
				State.$nodeAABBChanged.add(this.$parent);
			}
			State.$childrenChanged.add(this.$parent);
		}
		this.$parent = undefined;
	}

	/** Whether this {@link TreeNode} is a directed leaf. */
	public get $isLeaf(): boolean {
		return this.$children.$isEmpty;
	}

	/**
	 * Whether this {@link TreeNode} is a directed leaf,
	 * or is a root node with only one child.
	 *
	 * This is used only before balancing,
	 * when the root can temporarily become a leaf.
	 * After that, the more efficient {@link $isLeaf} should be used instead.
	 */
	public get $isLeafLike(): boolean {
		const childCount = this.$children.$size;
		return !this.$parent && childCount === 1 || childCount === 0;
	}

	/** The tag used for identifying objects in API. */
	public get $tag(): string {
		if(this.$isLeaf) return "f" + this.id;
		if(!this.$parent) return "root"; // Doesn't matter
		const pid = this.$parent.id;
		if(this.id < pid) return `re${this.id},${pid}`;
		else return `re${pid},${this.id}`;
	}
}
