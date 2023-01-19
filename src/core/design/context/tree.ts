import Processor from "core/service/processor";
import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";
import { TreeNode } from "./treeNode";
import { Side } from "./aabb/aabb";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { minComparator } from "shared/data/heap/heap";

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

	/** 節點的數目 */
	private _nodeCount: number = 0;

	/**
	 * 目前在 {@link _nodes} 當中被跳過的索引，以便快速查找出可用編號。
	 * 也許這邊用堆積有點太炫炮了，但何不呢？
	 */
	private _skippedIdHeap = new BinaryHeap<number>(minComparator);

	/**
	 * 任兩個節點的 Lowest Common Ancestor（LCA）之快取。
	 *
	 * 這邊我們不採用任何華麗的演算法來解決此問題，
	 * 而用 O(n^2) 的空間直接取得 O(1) 的查找。
	 * 樹狀結構的更新在實務上並不會很頻繁，而即使更新，需要更新的部份也不多。
	 */
	private readonly _lcaCache: IValuedDoubleMap<number, TreeNode> = new ValuedIntDoubleMap();

	/** 樹的根點 */
	private _root!: TreeNode;

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

		// 建立跳號清單
		if(this._nodes.length > this._nodeCount) {
			for(let i = 0; i < this._nodes.length; i++) {
				if(!this._nodes[i]) this._skippedIdHeap.$insert(i);
			}
		}

		// 首次平衡
		this._balance();

		// 處理 AABB 結構
		if(flaps) {
			for(const flap of flaps) {
				const node = this._nodes[flap.id];
				if(node) node.$setFlap(flap);
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $findAllOverlapping(): [TreeNode, TreeNode][] {
		const flaps = this._nodes.filter(n => n && n.$isLeaf) as TreeNode[];
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

		// 這個佇列的實作未來可以考慮優化
		const queue: TreeNode[] = [this._root];

		// 根據當前的樹狀結構以 BFS 的方式輸出
		while(queue.length) {
			const node = queue.shift()!;
			for(const child of node.$getChildren()) {
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

	public get $root(): TreeNode {
		return this._root;
	}

	public get $height(): number {
		return this._root.$height;
	}

	public $addLeaf(at: number, length: number): number {
		const id = this._nextAvailableId;
		this.$setEdge(at, id, length);
		this._balance();
		return id;
	}

	public $removeLeaf(id: number): boolean {
		const node = this._nodes[id];
		if(!node) return false;
		const result = node.$remove();
		if(result) {
			delete this._nodes[node.id];
			this._nodeCount--;
			if(node.id < this._nodeCount) this._skippedIdHeap.$insert(node.id);
			this._lcaCache.delete(node.id);
			this._balance();
		}
		return result;
	}

	/** 設定一條邊並且傳回是否有加入新邊 */
	public $setEdge(n1: number, n2: number, length: number): boolean {
		let N1 = this._nodes[n1], N2 = this._nodes[n2];

		// 如果圖非空，那加入的邊一定至少要有一點已經存在
		if(this._nodeCount != 0 && !N1 && !N2) {
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

	/**
	 * 傳回兩個節點的 LCA。
	 *
	 * 這個方法會對請求建立快取並且在可用的時候直接傳回快取。
	 * 實務上，我們真正關切的請求點對當中都會至少有一個是葉點，
	 * 所以我們只需要對那些請求建立快取即可，
	 * 其餘的都由 {@link _lca} 的非快取方法來計算。
	 */
	public $lca(n1: TreeNode, n2: TreeNode): TreeNode {
		let result = this._lcaCache.get(n1.id, n2.id);
		if(result) return result;
		result = this._lca(n1, n2);
		this._lcaCache.set(n1.id, n2.id, result);
		return result;
	}

	/** 傳回兩個節點在樹上的距離 */
	public $dist(n1: TreeNode, n2: TreeNode): number {
		return n1.$dist + n2.$dist - 2 * this.$lca(n1, n2).$dist;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _addLeaf(id: number, at?: TreeNode, length?: number): TreeNode {
		const newNode = new TreeNode(id, at, length);
		this._nodes[id] = newNode;
		this._nodeCount++;
		if(!TEST_MODE) Processor.$addNode(id);
		return newNode;
	}

	/** 自我平衡，使得樹高最低 */
	private _balance(): void {
		let newRoot = this._root.$balance();
		while(newRoot) {
			// 簡單起見，所有以原本根點為 LCA 的點對都要重新計算
			this._lcaCache.$deleteValue(this._root);

			this._root = newRoot;
			newRoot = this._root.$balance();
		}
		this._root.$setAsRoot();
	}

	/** 取得下一個可用的節點 id */
	private get _nextAvailableId(): number {
		if(this._skippedIdHeap.$isEmpty) return this._nodeCount;
		return this._skippedIdHeap.$pop()!;
	}

	/** 把樹的所有節點按照分支高度整理好 */
	private _getLevels(): TreeNode[][] {
		const levels: TreeNode[][] = [];
		for(const node of this._nodes) {
			if(!node) continue;
			const h = node.$height;
			(levels[h] ??= []).push(node);
		}
		return levels;
	}

	/**
	 * 找出 LCA 的核心遞迴方法。
	 *
	 * 這個方法不會在每一個步驟上建立快取，因為那樣反而比較慢。
	 *
	 * 這邊不太確定迴圈寫法跟遞迴寫法之間的優略關係，
	 * 理論上迴圈應該會比較快、但是實務上卻幾乎感受不到，
	 * 似乎引擎對於這種遞迴呼叫有做了優化。
	 */
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
