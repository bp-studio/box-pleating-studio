import * as DoubleLink from "shared/data/base/doubleLink";
import { AABB } from "./aabb/aabb";

import type { Polygon } from "shared/types/geometry";
import type { JEdge, JFlap } from "shared/json";
import type { IDoubleLinkedNode } from "shared/data/base/doubleLink";
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

	public $parent?: TreeNode;

	/** 節點往上的邊的長度 */
	private _length: number = 0;

	/** 第一個子點；子點依照分支高度從大到小排序 */
	private _firstChild?: TreeNode;

	/** 節點往下的分支高度（葉點為 0） */
	private _height: number = 0;

	/** 節點的深度（根點為 0） */
	private _depth: number = 0;

	/** 節點到根點的距離 */
	private _dist: number = 0;

	/** 節點（以及其往上的邊）所對應的 AABB */
	private readonly _AABB: AABB = new AABB();

	public $outerRoughContour!: Polygon;

	public $innerRoughContour!: Polygon;

	constructor(id: number, parent?: TreeNode, length: number = 0) {
		this.id = id;
		if(parent) {
			this._length = length;
			this._AABB.$setMargin(length);
			this.$pasteTo(parent);
			this._depth = parent._depth + 1;
			this._dist = parent._dist + length;
			parent._increaseBranchHeightRecursive(1);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $setFlap(flap: JFlap): void {
		this.$setAABB(flap.y + flap.height, flap.x + flap.width, flap.y, flap.x);
	}

	public $setAABB(top: number, right: number, bottom: number, left: number): void {
		this._AABB.$update(top, right, bottom, left);
		this._updateAABBRecursive();
	}

	public toJSON(): JEdge {
		if(!this.$parent) throw new Error("Cannot export root node");
		return { n1: this.$parent.id, n2: this.id, length: this._length };
	}

	/** 如果自身為葉點則將自己從連結關係上斷開，並傳回成功與否 */
	public $remove(): boolean {
		const parent = this.$parent;
		if(this._firstChild || !parent) return false;
		this.$cut();
		parent._decreaseBranchHeightRecursive(1);
		return true;
	}

	/**
	 * 試著對根點進行平衡，若成功的話傳回新的根點。
	 *
	 * 這個方法在平衡過程中可能會被多次呼叫。
	 */
	public $balance(): TreeNode | null {
		// 前置條件檢查
		if(this.$parent) return null;
		const first = this._firstChild;
		if(!first) return null;
		const height = first._next ? first._next._height + 1 : 0;
		if(first._height <= height) return null;

		// 進行平衡
		this._height = height;
		first.$cut();
		if(this._length == 0) {
			// 首次成為子點的話必須進行這個設定
			this._AABB.$setMargin(first._length);
		}
		this._length = first._length;
		this.$pasteTo(first);
		first._length = 0;
		return first;
	}

	/**
	 * 當自身成為新的根點的時候完整刷新整個樹的 depth 與 dist 值。
	 *
	 * 這個方法會在全部的平衡完成了之後才進行，以增進效能。
	 */
	public $setAsRoot(): void {
		this._updateDepthRecursive(0);
		this._updateDistRecursive(0);
	}

	public $pasteTo(parent: TreeNode): void {
		this.$parent = parent;
		this._forwardInsert(undefined, parent._firstChild);
		if(parent._AABB.$addChild(this._AABB)) {
			parent._updateAABBRecursive();
		}
	}

	/**
	 * 把一個節點從樹狀結構上面暫時剪下。其子分支的狀態不會改變。
	 * 注意到這個方法並不會重新計算其父點的分支高度。
	 */
	public $cut(): void {
		this._unlink();
		if(this.$parent && this.$parent._AABB.$removeChild(this._AABB)) {
			this.$parent._updateAABBRecursive();
		}
		this.$parent = undefined;
		this._next = undefined;
		this._prev = undefined;
	}

	public get $branchHeight(): number {
		return this._height;
	}

	/** 設定或讀取這個節點往上的邊之長度 */
	public get $length(): number {
		return this._length;
	}
	public set $length(l: number) {
		if(this._length == l) return;
		this._length = l;
		this._updateDistRecursive(this.$parent!._dist + l);
		this._AABB.$setMargin(l);
		this._updateAABBRecursive();
	}

	public get $AABB(): number[] {
		return this._AABB.$get();
	}

	public get $depth(): number {
		return this._depth;
	}

	public get $dist(): number {
		return this._dist;
	}

	public get $isLeaf(): boolean {
		return this._firstChild == undefined;
	}

	public *$getChildren(): IterableIterator<TreeNode> {
		let cursor = this._firstChild;
		while(cursor) {
			yield cursor;
			cursor = cursor._next;
		}
	}

	public get $riverTag(): string {
		const pid = this.$parent!.id;
		if(this.id < pid) return `re${this.id},${pid}`;
		else return `re${pid},${this.id}`;
	}

	/**
	 * 列出所有與自身有所重疊的角片（只會跟樹狀結構中右側的進行比對）。
	 *
	 * 理論上如果改成「只跟樹狀結構左側的比較」在我們這邊的子點順序設計之下應該會減少比較次數，
	 * 但是那種比較方式的實作會比較複雜，而且這邊遠遠不是效能瓶頸所在，所以先不考慮這個優化。
	 */
	public $findOverlapping(tree: Tree): TreeNode[] {
		const result: TreeNode[] = [];
		let cursor: TreeNode | undefined = this;
		while(cursor) {
			if(cursor._next) this._findOverlappingRecursive(tree, result, cursor._next);
			cursor = cursor.$parent;
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _increaseBranchHeightRecursive(proposedHeight: number): void {
		if(this._height < proposedHeight) {
			this._height = proposedHeight;
			if(this._prev && this._prev._height < this._height) {
				this._unlink();
				this._backwardInsert(this._prev, this._next);
			}
			if(this.$parent) this.$parent._increaseBranchHeightRecursive(proposedHeight + 1);
		}
	}

	private _decreaseBranchHeightRecursive(deprecatedHeight: number): void {
		if(this._height == deprecatedHeight) {
			const newHeight = this._firstChild ? this._firstChild._height + 1 : 0;
			if(newHeight == this._height) return;
			if(this._next && this._next._height > this._height) {
				this._unlink();
				this._forwardInsert(this._prev, this._next);
			}
			if(this.$parent) this.$parent._decreaseBranchHeightRecursive(newHeight + 1);
		}
	}

	/** 往後尋找適合的插入點並插入 */
	private _forwardInsert(prev?: TreeNode, next?: TreeNode): void {
		while(next && next._height > this._height) {
			prev = next;
			next = next._next;
		}
		this._link(prev, next);
	}

	/** 往前尋找適合的插入點並插入 */
	private _backwardInsert(prev?: TreeNode, next?: TreeNode): void {
		while(prev && prev._height < this._height) {
			next = prev;
			prev = prev._prev;
		}
		this._link(prev, next);
	}

	/** 插入到指定的兩點之間，並視情況更新父點的 {@link TreeNode._firstChild $firstChild} */
	private _link(prev?: TreeNode, next?: TreeNode): void {
		DoubleLink.link(this, prev, next);
		if(!prev && this.$parent) this.$parent._firstChild = this;
	}

	/**
	 * 把前後節點接起來，並視情況更新父點的 {@link TreeNode._firstChild $firstChild}。
	 *
	 * 這個操作並不會清除自身的前後連結，以方便後續操作。
	 */
	private _unlink(): void {
		DoubleLink.unlink(this, next => this.$parent && (this.$parent._firstChild = next));
	}

	/** 更新自身的深度，並且遞迴地更新自己所有的子點 */
	private _updateDepthRecursive(v: number): void {
		this._depth = v++;
		for(const child of this.$getChildren()) {
			child._updateDepthRecursive(v);
		}
	}

	/** 更新自身的距離，並且遞迴地更新自己所有的子點 */
	private _updateDistRecursive(v: number): void {
		this._dist = v;
		for(const child of this.$getChildren()) {
			child._updateDistRecursive(v + child._length);
		}
	}

	/** 遞迴地更新父點的 AABB */
	private _updateAABBRecursive(): void {
		if(this.$parent && this.$parent._AABB.$updateChild(this._AABB)) {
			this.$parent._updateAABBRecursive();
		}
	}

	/** 從一個指定的優標位置開始，遞迴地往下找出重疊 */
	private _findOverlappingRecursive(tree: Tree, result: TreeNode[], cursor?: TreeNode): void {
		while(cursor) {
			const gap = tree.$dist(this, cursor) - this._length - cursor._length;
			if(this._AABB.$intersects(cursor._AABB, gap)) {
				if(cursor._firstChild) {
					// 往下遞迴搜尋子節點
					this._findOverlappingRecursive(tree, result, cursor._firstChild);
				} else {
					// 找到重疊的葉點（角片）了，加入結果
					result.push(cursor);
				}
			}
			cursor = cursor._next;
		}
	}
}

export interface TreeNode extends IDoubleLinkedNode<TreeNode> { }
