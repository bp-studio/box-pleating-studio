import Processor from "core/service/processor";
import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";
import { TreeNode } from "./treeNode";
import { Side } from "./aabb/aabb";

import type { Path } from "shared/types/geometry";
import type { IValuedDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { ITree } from ".";
import type { JEdge, JFlap } from "shared/json";

//=================================================================
/**
 * {@link Tree} 是一個 {@link Design} 中最底層的資料結構。
 *
 * 這邊基於效能最佳化上的考量，並不將不同層面的樹狀功能分開來實作，
 * 而是全部時做在同一個類別裡面。
 */
//=================================================================

export class Tree implements ITree {

	private readonly _nodes: Map<number, TreeNode> = new Map();

	/**
	 * 任兩個節點的 Lowest Common Ancestor（LCA）之快取。
	 *
	 * 這邊我們不採用任何華麗的演算法來解決此問題，
	 * 而用 O(n^2) 的空間直接取得 O(1) 的查找。
	 * 樹狀結構的更新在實務上並不會很頻繁，而即使更新，需要更新的部份也不多。
	 */
	private readonly _lca: IValuedDoubleMap<number, TreeNode> = new ValuedIntDoubleMap();

	private _root!: TreeNode;

	constructor(edges: JEdge[], flaps?: JFlap[]) {
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

		this._balance();

		// 處理 AABB 結構
		if(flaps) {
			for(const flap of flaps) {
				const node = this.$nodes.get(flap.id);
				if(node) node.$setFlap(flap);
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $findAllOverlapping(): [TreeNode, TreeNode][] {
		const flaps = [...this.$nodes.values()].filter(n => n.$isLeaf);
		const result: [TreeNode, TreeNode][] = [];
		for(const flap of flaps) {
			result.push(...flap.$findOverlapping(this).map(n => [flap, n] as [TreeNode, TreeNode]));
		}
		return result;
	}

	public $buildContour(): void {
		const levels = this._getLevels();

		for(const leaf of levels[0]) {
			const aabb = leaf.$AABB;
			const path: Path = [
				{ x: aabb[Side._left], y: aabb[Side._bottom] },
				{ x: aabb[Side._right], y: aabb[Side._bottom] },
				{ x: aabb[Side._right], y: aabb[Side._top] },
				{ x: aabb[Side._left], y: aabb[Side._top] },
			];
			leaf.$outerRoughContour = [path];
			Processor.$addContour("f" + leaf.id, [{ outer: path }]);
		}

		const union = new AAUnion();
		for(let h = 1; h < levels.length - 1; h++) {
			for(const node of levels[h]) {
				const components = [...node.$getChildren()].map(n => n.$outerRoughContour);
				const inner = union.$get(...components);
				node.$innerRoughContour = inner;
				const contours = expand(inner, node.$length);
				node.$outerRoughContour = contours.map(c => c.outer);
				Processor.$addContour(node.$riverTag, contours);
			}
		}
	}

	public toJSON(): JEdge[] {
		const result: JEdge[] = [];
		const queue: TreeNode[] = [this._root];
		// 根據當前的樹狀結構以 BFS 的方式輸出，如此一來下次載入的時候就無須經過平衡
		while(queue.length) {
			const node = queue.shift()!;
			for(const child of node.$getChildren()) {
				result.push(child.toJSON());
				if(!child.$isLeaf) queue.push(child);
			}
		}
		return result;
	}

	public get $nodes(): ReadonlyMap<number, TreeNode> {
		return this._nodes;
	}

	public get $root(): TreeNode {
		return this._root;
	}

	public get $height(): number {
		return this._root.$branchHeight;
	}

	public $addLeaf(at: number, length: number): number {
		const id = this._nextAvailableId;
		this.$setEdge(at, id, length);
		this._balance();
		return id;
	}

	public $removeLeaf(id: number): boolean {
		const node = this._nodes.get(id);
		if(!node) return false;
		const result = node.$remove();
		if(result) {
			this._nodes.delete(node.id);
			this._lca.delete(node.id);
			this._balance();
		}
		return result;
	}

	/** 設定一條邊並且傳回是否有加入新邊 */
	public $setEdge(n1: number, n2: number, length: number): boolean {
		let N1 = this._nodes.get(n1), N2 = this._nodes.get(n2);

		// 如果圖非空，那加入的邊一定至少要有一點已經存在
		if(this._nodes.size != 0 && !N1 && !N2) {
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
			if(!N1) this._root = N1 = this._addLeaf(n1);
			N2 = this._addLeaf(n2, N1, length);
		}

		if(!TEST_MODE) Processor.$addEdge({ n1, n2, length });
		return true;
	}

	public lca(n1: TreeNode, n2: TreeNode): TreeNode {
		if(n1 == n2) return n1;
		let result = this._lca.get(n1.id, n2.id);
		if(result) return result;
		else if(n1.$depth > n2.$depth) result = this.lca(n1.$parent!, n2);
		else if(n2.$depth > n1.$depth) result = this.lca(n1, n2.$parent!);
		else result = this.lca(n1.$parent!, n2.$parent!);
		this._lca.set(n1.id, n2.id, result);
		return result;
	}

	public $dist(n1: TreeNode, n2: TreeNode): number {
		return n1.$dist + n2.$dist - 2 * this.lca(n1, n2).$dist;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addLeaf(id: number, at?: TreeNode, length?: number): TreeNode {
		const newNode = new TreeNode(id, at, length);
		this._nodes.set(id, newNode);
		if(!TEST_MODE) Processor.$addNode(id);
		return newNode;
	}

	/** 自我平衡，使得樹高最低 */
	private _balance(): void {
		let newRoot = this._root.$balance();
		while(newRoot) {
			// 簡單起見，所有以原本根點為 LCA 的點對都要重新計算
			this._lca.$deleteValue(this._root);

			this._root = newRoot;
			newRoot = this._root.$balance();
		}
		this._root.$setAsRoot();
	}

	/** 取得下一個可用的節點 id */
	private get _nextAvailableId(): number {
		let id = 0;
		while(this._nodes.has(id)) id++;
		return id;
	}

	/** 把樹的所有節點按照分支高度整理好 */
	private _getLevels(): TreeNode[][] {
		const levels: TreeNode[][] = [];
		for(const node of this.$nodes.values()) {
			const h = node.$branchHeight;
			(levels[h] ??= []).push(node);
		}
		return levels;
	}
}
