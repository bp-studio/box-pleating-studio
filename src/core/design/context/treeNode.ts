import { AABB } from "./aabb/aabb";
import { MutableHeap } from "shared/data/heap/mutableHeap";
import { State } from "core/service/state";
import { Processor } from "core/service/processor";

import type { Polygon } from "shared/types/geometry";
import type { JEdge, JFlap } from "shared/json";
import type { ITreeNode } from ".";
import type { Tree } from "./tree";

//=================================================================
/**
 * {@link TreeNode} 代表 {@link Tree} 上的一個節點。
 * 對於非根點來說，它同時也紀錄著其父邊的相關資訊。
 */
//=================================================================

export class TreeNode implements ITreeNode {

	/** 節點的 id */
	public readonly id: number;

	public $parent: TreeNode | undefined;

	/** 節點到根點的距離 */
	public $dist: number = 0;

	/**
	 * 節點往下的分支高度（葉點為 0）。
	 *
	 * 初始值故意設置為 -1，以便第一次的時候也會觸發變更。
	 */
	public $height: number = -1;

	/** 節點（以及其往上的邊）所對應的 AABB */
	public readonly $AABB: AABB = new AABB();

	/** 所有的子點，利用最大高度堆積來實作 */
	public $children = new MutableHeap<TreeNode>((a, b) => b.$height - a.$height);

	public $outerRoughContour!: Polygon;

	public $innerRoughContour!: Polygon;

	/** 節點往上的邊的長度 */
	public $length: number = 0;

	constructor(id: number, parent?: TreeNode, length: number = 0) {
		this.id = id;
		State.$childrenChanged.add(this);
		Processor.$addNode(id);
		if(parent) {
			State.$lengthChanged.add(this);
			State.$parentChanged.add(this);
			this.$length = length;
			this.$AABB.$setMargin(length);
			this.$pasteTo(parent);
			this.$dist = parent.$dist + length;
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $setFlap(flap: JFlap): void {
		this.$setAABB(flap.y + flap.height, flap.x + flap.width, flap.y, flap.x);
	}

	/** 這個方法順便是測試用的 */
	public $setAABB(top: number, right: number, bottom: number, left: number): void {
		State.$flapAABBChanged.add(this);
		this.$AABB.$update(top, right, bottom, left);
	}

	public toJSON(): JEdge {
		if(!this.$parent) throw new Error("Cannot export root node");
		return { n1: this.$parent.id, n2: this.id, length: this.$length };
	}

	/** 如果自身為葉點則將自己從連結關係上斷開，並傳回成功與否 */
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
			Processor.$addEdge({ n1: this.id, n2: parent.id, length: this.$length });
		}
	}

	/** 把一個節點從樹狀結構上面暫時剪下。其子分支的狀態不會改變。 */
	public $cut(skipProcess?: boolean): void {
		if(this.$parent) {
			this.$parent.$children.$remove(this);
			State.$childrenChanged.add(this.$parent);
			if(!skipProcess) Processor.$removeEdge({ n1: this.id, n2: this.$parent.id });
		}
		this.$parent = undefined;
	}

	public get $isLeaf(): boolean {
		return this.$children.$isEmpty;
	}

	public get $riverTag(): string {
		const pid = this.$parent!.id;
		if(this.id < pid) return `re${this.id},${pid}`;
		else return `re${pid},${this.id}`;
	}
}
