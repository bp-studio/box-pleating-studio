
@shrewd class Tree extends Disposable {

	@shrewd({
		renderer(this: Tree, v: Map<number, TreeNode>) {
			for(let [id, node] of v) if(node.disposed) v.delete(id);
			return v;
		}
	})
	public node: Map<number, TreeNode> = new Map();

	@shrewd({
		renderer(this: Tree, v: DoubleMap<TreeNode, TreeEdge>) {
			for(let node of v.firstKeys()) if(node.disposed) v.delete(node);
			return v;
		}
	})
	public edge: DoubleMap<TreeNode, TreeEdge> = new DoubleMap();

	public readonly design: Design;

	constructor(design: Design, edges?: JEdge[]) {
		super(design);
		this.design = design;

		// 防呆載入所有的邊；傳入資料的順序無所謂
		while(edges?.length) {
			let remain: JEdge[] = [], ok = false;
			for(let e of edges) {
				if(this.addEdge(e.n1, e.n2, e.length)) ok = true;
				else {
					remain.push(e);
				}
			}
			if(!ok) break; // 防呆
			edges = remain;
		}
	}

	protected onDispose(): void {
		Shrewd.terminate(this.edge);
		this.path.dispose();
	}

	/** 當前樹的全體路徑。樹上的任兩點之間都有唯一的一條路徑。 */
	public readonly path = new DoubleMapping<TreeNode, TreePath>(
		() => this.node.values(),
		(n1, n2) => new TreePath(n1, n2)
	);

	@shrewd public get leaf(): ReadonlySet<TreeNode> {
		var set: Set<TreeNode> = new Set();
		for(let node of this.node.values()) if(node.degree == 1) set.add(node);
		return set;
	}

	private nextId = 0;

	public generateJID() {
		let arr = Array.from(this.node.values()).sort((a, b) => a.id - b.id), i = 0;
		for(let n of arr) this.jidMap.set(n.id, n.jid = i++);
	}

	public readonly jidMap = new Map<number, number>();

	public dist(n1: TreeNode, n2: TreeNode) {
		if(n1 == n2) return 0;
		let path = this.path.get(n1, n2);
		return path ? path.length : NaN;
	}

	private getOrAddNode(n: number) {
		let N: TreeNode;
		if(this.node.has(n)) N = this.node.get(n)!;
		else {
			this.node.set(n, N = new TreeNode(this, n));
			if(n >= this.nextId) this.nextId = n + 1;
		}
		return N;
	}

	public split(e: TreeEdge) {
		let N = this.getOrAddNode(this.nextId);
		let { n1, n2 } = e;
		this.edge.delete(n1, n2);
		this.edge.set(N, n1, new TreeEdge(N, n1, Math.ceil(e.length / 2)));
		this.edge.set(N, n2, new TreeEdge(N, n2, Math.max(Math.floor(e.length / 2), 1)));
		e.dispose();
		return N;
	}

	public deleteAndMerge(e: TreeEdge) {
		let N = this.getOrAddNode(this.nextId);
		let { n1, n2, a1, a2 } = e;
		this.edge.delete(n1, n2);
		for(let edge of a1) {
			let n = edge.n(n1);
			this.edge.delete(n, n1);
			this.edge.set(N, n, new TreeEdge(N, n, edge.length));
		}
		for(let edge of a2) {
			let n = edge.n(n2);
			this.edge.delete(n, n2);
			this.edge.set(N, n, new TreeEdge(N, n, edge.length));
		}
		n1.dispose(true);
		n2.dispose(true);
		return N;
	}

	public deleteAndJoin(n: TreeNode) {
		let edges = n.edges;
		if(edges.length != 2) {
			console.warn(`Incorrectly calling delete-and-join at [${n.id}].`);
			return;
		}
		let e1 = edges[0], e2 = edges[1];
		let N1 = e1.n(n), N2 = e2.n(n);
		let edge = new TreeEdge(N1, N2, e1.length + e2.length);
		this.edge.set(N1, N2, edge);
		n.dispose(true);
		return edge;
	}

	public addLeafAt(n: number, length: number) {
		let id = this.nextId;
		this.addEdge(n, id, length);
		return this.node.get(id)!;
	}

	/** 加入一條邊並且傳回是否成功 */
	public addEdge(n1: number, n2: number, length: number) {
		let has1 = this.node.has(n1), has2 = this.node.has(n2);

		// 如果圖非空，那加入的邊一定至少要有一點已經存在
		if(this.node.size != 0 && !has1 && !has2) {
			console.warn(`Adding edge (${n1},${n2}) disconnects the graph.`);
			return false;
		}
		let N1 = this.getOrAddNode(n1), N2 = this.getOrAddNode(n2);

		if(this.edge.has(N1, N2)) { // 如果邊已經存在，純粹更新長度
			this.edge.get(N1, N2)!.length = length;
			return false;
		} else if(has1 && has2) { // 不能加入一條邊是兩個結點都已經存在的
			console.warn(`Adding edge (${n1},${n2}) will cause circuit.`);
			return false;
		}
		let edge = new TreeEdge(N1, N2, length);
		this.edge.set(N1, N2, edge);

		return true;
	}

	/** 傳入樹中的三個點，傳回三個點分別到「路口」的距離。 */
	public distTriple(n1: TreeNode, n2: TreeNode, n3: TreeNode) {
		let d12 = this.dist(n1, n2);
		let d13 = this.dist(n1, n3);
		let d23 = this.dist(n2, n3);
		let total = (d12 + d13 + d23) / 2;
		return {
			d1: total - d23,
			d2: total - d13,
			d3: total - d12
		};
	}
}
