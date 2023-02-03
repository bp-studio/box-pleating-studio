import { Processor } from "core/service/processor";
import { TreeNode } from "./treeNode";
import { State } from "core/service/state";

import type { ITree, ITreeNode } from ".";
import type { JEdge, JFlap } from "shared/json";

//=================================================================
/**
 * {@link Tree} 是一個 {@link Design} 中最底層的資料結構。
 *
 * 這邊基於效能最佳化上的考量，並不將不同層面的樹狀功能分開來實作，
 * 而是全部時做在同一個類別裡面。
 *
 * 裡面有部份公開成員的型別比 {@link ITree} 介面宣告得要更加具體，
 * 這是為了測試的方便。
 */
//=================================================================

export class Tree implements ITree {

	/**
	 * 所有節點的陣列。
	 * 請注意裡面可能有一些索引是被跳過的。
	 */
	private readonly _nodes: (TreeNode | undefined)[];

	/** 所有的葉點 */
	private readonly _leaves = new Set<TreeNode>();

	/** 樹的根點 */
	public $root!: TreeNode;

	constructor(edges: JEdge[], flaps?: JFlap[]) {
		this._nodes = new Array(edges.length + 1);

		// 防呆載入所有的邊；傳入資料的順序無所謂
		while(edges.length) {
			const remain: JEdge[] = [];
			let newEdgeAdded = false;
			for(const e of edges) {
				if(this.$setEdge(e.n1, e.n2, e.length)) {
					newEdgeAdded = true;
				} else {
					remain.push(e);
				}
			}
			if(!newEdgeAdded) break; // 防呆
			edges = remain;
		}

		// 處理 AABB 結構
		if(flaps) {
			for(const flap of flaps) {
				const node = this._nodes[flap.id];
				if(node) node.$setFlap(flap);
			}
		}

		State.$tree = this;
		State.$rootChanged = true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public toJSON(): JEdge[] {
		const result: JEdge[] = [];

		// 這個佇列的實作未來可以考慮優化
		const queue: TreeNode[] = [this.$root];

		// 根據當前的樹狀結構以 BFS 的方式輸出
		while(queue.length) {
			const node = queue.shift()!;
			for(const child of node.$children) {
				result.push(child.toJSON());
				if(!child.$isLeaf) queue.push(child);
			}
		}
		return result;
	}

	/** 公開的節點陣列 */
	public get $nodes(): readonly (TreeNode | undefined)[] {
		return this._nodes;
	}

	public get $height(): number {
		return this.$root.$height;
	}

	public $addLeaf(id: number, at: number, length: number): ITreeNode {
		this.$setEdge(at, id, length);
		return this.$nodes[id]!;
	}

	public $removeLeaf(id: number): boolean {
		const node = this._nodes[id];
		if(!node || !node.$isLeaf) return false;

		const parent = node.$parent!;
		node.$cut();
		this._leaves.delete(node);
		if(parent.$isLeaf) {
			this._leaves.add(parent);
			State.$flapAABBChanged.add(parent);
		}
		this._removeNode(id);
		return true;
	}

	public $setFlaps(flaps: JFlap[]): void {
		for(const flap of flaps) {
			const node = this._nodes[flap.id];
			const isLeaf = node && node.$isLeaf ||
				// 這邊有一個小小的可能是刪除完點的瞬間、根點也是葉點
				node === this.$root && node.$children.$size === 1;
			if(isLeaf) node.$setFlap(flap);
		}
	}

	public $join(id: number): void {
		const node = this._nodes[id]!;
		const parent = node.$parent;
		const child = node.$children.$get()!;
		const second = node.$children.$getSecond()!;
		child.$cut();
		if(parent) {
			node.$cut();
			child.$length += node.$length;
			child.$pasteTo(parent);
		} else {
			second.$length += child.$length;
			second.$cut();
			second.$pasteTo(child);
			this.$root = child;
			State.$rootChanged = true;
		}
		this._removeNode(id);
	}

	public $split(id: number, n: number): void {
		const node = this._nodes[n]!;
		const parent = node.$parent!;
		const l = node.$length;
		node.$cut();
		this.$setEdge(parent.id, id, Math.ceil(l / 2));
		node.$length = Math.max(Math.floor(l / 2), 1);
		node.$pasteTo(this._nodes[id]!);
	}

	public $merge(id: number): void {
		const node = this._nodes[id]!;
		const parent = node.$parent!;
		node.$cut();
		for(const child of node.$children) {
			child.$cut();
			child.$pasteTo(parent);
		}
		this._removeNode(id);
	}

	/** 設定一條邊並且傳回是否有加入新邊 */
	public $setEdge(n1: number, n2: number, length: number): boolean {
		let N1 = this._nodes[n1], N2 = this._nodes[n2];

		// 如果圖非空，那加入的邊一定至少要有一點已經存在
		if(this.$root && !N1 && !N2) {
			console.warn(`Adding edge (${n1},${n2}) disconnects the graph.`);
			return false;
		}

		if(N1 && N2) {
			// 如果邊已經存在，純粹更新長度
			if(N1.$parent == N2) N1.$length = length;
			else if(N2.$parent == N1) N2.$length = length;
			else console.warn(`Adding edge (${n1},${n2}) will cause circuit.`);
			return false;
		}

		if(N2) {
			N1 = this._addLeaf(n1, N2, length);
		} else {
			if(!N1) this.$root = N1 = this._addLeaf(n1);
			N2 = this._addLeaf(n2, N1, length);
		}

		return true;
	}

	/** 傳回兩個節點在樹上的距離 */
	public $dist(n1: TreeNode, n2: TreeNode): number {
		return n1.$dist + n2.$dist - 2 * this._lca(n1, n2).$dist;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addLeaf(id: number, at?: TreeNode, length?: number): TreeNode {
		const atLeaf = at && at.$isLeaf;
		const newNode = new TreeNode(id, at, length);
		if(atLeaf) this._leaves.delete(at);
		this._leaves.add(newNode);
		this._nodes[id] = newNode;
		return newNode;
	}

	private _removeNode(id: number): void {
		const node = this._nodes[id]!;
		State.$childrenChanged.delete(node);
		delete this._nodes[id];
		Processor.$removeNode(id);
	}

	/** 傳回兩個節點的 LCA */
	private _lca(n1: TreeNode, n2: TreeNode): TreeNode {
		// 基底情況
		if(n1 == n2) return n1;

		// 遞迴情況；這一段原本比較的是節點的深度，
		// 但是其實比較節點的距離也是一樣的效果，而且可以少維護一個欄位。
		if(n1.$dist > n2.$dist) return this._lca(n1.$parent!, n2);
		if(n2.$dist > n1.$dist) return this._lca(n1, n2.$parent!);
		return this._lca(n1.$parent!, n2.$parent!);
	}
}
