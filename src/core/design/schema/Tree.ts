
//////////////////////////////////////////////////////////////////
/**
 * {@link Tree} 是一個 {@link Design} 中最底層的資料結構。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Tree extends Disposable {

	public static readonly $MIN_NODES = 3;
	public readonly $design: Design;

	constructor(design: Design, edges?: JEdge[]) {
		super(design);
		this.$design = design;

		// 防呆載入所有的邊；傳入資料的順序無所謂
		while(edges?.length) {
			let remain: JEdge[] = [], ok = false;
			for(let e of edges) {
				if(this.$addEdge(e.n1, e.n2, e.length)) {
					ok = true;
				} else {
					remain.push(e);
				}
			}
			if(!ok) break; // 防呆
			edges = remain;
		}
	}

	protected $onDispose(): void {
		Shrewd.terminate(this.$edge);
	}

	public get $isMinimal(): boolean {
		return this.$node.size <= Tree.$MIN_NODES;
	}

	@shrewd({
		renderer(this: Tree, v: Map<number, TreeNode>) {
			for(let [id, node] of v) if(node.$disposed) v.delete(id);
			return v;
		},
	})
	public $node: Map<number, TreeNode> = new Map();

	@shrewd({
		renderer(this: Tree, v: DoubleMap<TreeNode, TreeEdge>) {
			for(let node of v.firstKeys()) if(node.$disposed) v.delete(node);
			return v;
		},
	})
	public $edge: DoubleMap<TreeNode, TreeEdge> = new DoubleMap();

	@shrewd public get $leaf(): ReadonlySet<TreeNode> {
		let set: Set<TreeNode> = new Set();
		for(let node of this.$node.values()) if(node.$degree == 1) set.add(node);
		return set;
	}

	private _nextId = 0;

	/** 在 JID 啟動的模式之下執行指定操作 */
	public withJID(action: Action): void {
		let arr = Array.from(this.$node.values()).sort((a, b) => a.id - b.id), i = 0;
		for(let n of arr) TreeNode.$setJID(n, i++);
		this._jid = true;
		action();
		this._jid = false;
	}

	private _jid = false;

	public get $jid(): boolean { return this._jid; }

	/**
	 * 利用 LCA 來計算任意兩點之間的距離。
	 *
	 * 由於這個計算本身是空間 0 耗時 O(1)，所以其時空成本跟 LCA 是一樣的。
	 *
	 * 最早採用的演算法是暴力儲存 TreePath 以持續追蹤距離，
	 * 其耗時 O(1) 但空間消耗高達 O(n^3)，非常可怕，更動也因此極慢。
	 */
	public $dist(n1: TreeNode, n2: TreeNode): number {
		this.$disposeEvent();
		if(n1 == n2) return 0;
		return n1.$dist + n2.$dist - 2 * this.lca(n1, n2).$dist;
	}

	/**
	 * 找出兩個點的 Lowest Common Ancestor（LCA）。
	 *
	 * 這邊採用的新演算法是根據 TreeNode.path 來查找，
	 * 儲存空間 O(n log n)、查找耗時 O(log n)、更動耗時 O(n)。
	 *
	 * 前一版的演算法（利用 TreePair 物件持續追蹤 LCA）則是儲存 O(n^2) 查找 O(1) 更動 O(n^2)，
	 * 雖然它查找最快，但是儲存和更動成本太高，新版的演算法比較平衡。
	 *
	 * 理論上其實是存在儲存 O(n) 查找 O(1) 更動 O(n) 的演算法，
	 * 其概念是把 LCA 問題轉換成 RMQ 然後再用複雜的方式預先處理以便可以耗時 O(1) 回答 RMQ 問題，
	 * 但是這個演算法一方面實作很困難，
	 * 另一方面這個演算法一旦樹有局部更動就要全部預存資料重新計算（雖然理論上耗時仍然是 O(n)），
	 * 我實務上會遇到的樹大小應該難以讓這種演算法展現優勢，所以我先不考慮。
	 */
	public lca(n1: TreeNode, n2: TreeNode): TreeNode {
		let p1 = n1.$path, p2 = n2.$path, lca = p1[0], i = 1;
		while(i < p1.length && i < p2.length && p1[i] == p2[i]) lca = p1[i++];
		return lca;
	}

	public $find(id: string): TreeEdge | undefined {
		let [n1, n2] = id.split(',').map(i => this.$node.get(Number(i)));
		if(!n1 || !n2) return undefined;
		return this.$edge.get(n1, n2);
	}

	public $getOrAddNode(n: number): TreeNode {
		let N: TreeNode;
		if(this.$node.has(n)) {
			N = this.$node.get(n)!;
		} else {
			N = new TreeNode(this, n);
			this.$node.set(N.id, N);
			this.$design.$history?.$add(N);
			if(n >= this._nextId) this._nextId = n + 1;
		}
		return N;
	}

	public $split(e: TreeEdge): TreeNode {
		let N = this.$getOrAddNode(this._nextId);
		let { n1, n2 } = e;
		if(n1.$parent == n2) [n1, n2] = [n2, n1];
		N.parentId = n1.id;
		n2.parentId = N.id;
		this._createEdge(N, n1, Math.ceil(e.length / 2));
		this._createEdge(N, n2, Math.max(Math.floor(e.length / 2), 1));
		this.$remove(e);
		return N;
	}

	public $deleteAndMerge(e: TreeEdge): TreeNode {
		let N = this.$getOrAddNode(this._nextId);
		let { n1, n2, a1, a2 } = e;
		if(n1.$parent == n2) {
			[n1, n2] = [n2, n1];
			[a1, a2] = [a2, a1];
		}

		N.parentId = n1.$parent?.id;
		this.$remove(e);

		for(let edge of a1) {
			let n = edge.n(n1);
			if(n != N.$parent) n.parentId = N.id;
			this.$remove(edge);
			this._createEdge(N, n, edge.length);
		}
		for(let edge of a2) {
			let n = edge.n(n2);
			n.parentId = N.id;
			this.$remove(edge);
			this._createEdge(N, n, edge.length);
		}
		this.$remove(n1);
		this.$remove(n2);
		return N;
	}

	public static $deleteAndJoin(n: TreeNode): TreeEdge | undefined {
		let edges = n.edges;
		if(edges.length != 2) {
			console.warn(`Incorrectly calling delete-and-join at [${n.id}].`);
			return;
		}
		let e1 = edges[0], e2 = edges[1];
		let n1 = e1.n(n), n2 = e2.n(n);
		if(n.$parent == n2) [n1, n2] = [n2, n1];

		n2.parentId = n1.id;
		let edge = n1.$tree._createEdge(n1, n2, e1.length + e2.length);
		let tree = n1.$tree;
		tree.$remove(e1);
		tree.$remove(e2);
		tree.$remove(n);
		return edge;
	}

	public $addLeafAt(n: number, length: number): TreeNode {
		let id = this._nextId;
		this.$addEdge(n, id, length)!;
		return this.$node.get(id)!;
	}

	/** 加入一條邊並且傳回；若失敗則傳回 null */
	public $addEdge(n1: number, n2: number, length: number): TreeEdge | null {
		let has1 = this.$node.has(n1), has2 = this.$node.has(n2);

		// 如果圖非空，那加入的邊一定至少要有一點已經存在
		if(this.$node.size != 0 && !has1 && !has2) {
			console.warn(`Adding edge (${n1},${n2}) disconnects the graph.`);
			return null;
		}
		let N1 = this.$getOrAddNode(n1), N2 = this.$getOrAddNode(n2);

		if(this.$edge.has(N1, N2)) { // 如果邊已經存在，純粹更新長度
			this.$edge.get(N1, N2)!.length = length;
			return null;
		} else if(has1 && has2) { // 不能加入一條邊是兩個結點都已經存在的
			console.warn(`Adding edge (${n1},${n2}) will cause circuit.`);
			return null;
		}

		if(has1) N2.parentId = n1;
		else if(has2) N1.parentId = n2;
		else N2.parentId = n1;

		return this._createEdge(N1, N2, length);
	}

	private _createEdge(n1: TreeNode, n2: TreeNode, length: number): TreeEdge {
		let e = new TreeEdge(n1, n2, length);
		this.$edge.set(n1, n2, e);
		this.$design.$history?.$add(e);
		return e;
	}

	/** 傳入樹中的三個點，傳回三個點分別到「路口」的距離。 */
	public $distTriple(n1: TreeNode, n2: TreeNode, n3: TreeNode): {
		d1: number; d2: number; d3: number;
	} {
		let d12 = this.$dist(n1, n2);
		let d13 = this.$dist(n1, n3);
		let d23 = this.$dist(n2, n3);
		let total = (d12 + d13 + d23) / 2;
		return {
			d1: total - d23,
			d2: total - d13,
			d3: total - d12,
		};
	}

	public $remove(obj: TreeElement): void {
		this.$design.$history?.$remove(obj);
		obj.$dispose(true);
	}
}
