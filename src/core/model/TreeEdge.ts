
@shrewd class TreeEdge extends Disposible implements IDesignObject {

	private readonly _n1: TreeNode;
	private readonly _n2: TreeNode;

	@action({ validator: (v: number) => v > 0 }) public length: number;

	constructor(n1: TreeNode, n2: TreeNode, length: number) {
		super();
		this._n1 = n1;
		this._n2 = n2;
		this.length = length;
	}

	public get design() { return this.n1.design; }

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this._n1.disposed || this._n2.disposed;
	}

	@shrewd public get isRiver() {
		return this.g1.length > 1 && this.g2.length > 1;
	}

	/////////////////////////////////////////////////////////////////
	// 相鄰邊
	private adjacentEdges(n: TreeNode) { return n.edges.filter(e => e != this); }

	/** 相對於 n1 的所有相鄰邊 */
	@shrewd public get a1(): readonly TreeEdge[] { return this.adjacentEdges(this._n1); }

	/** 相對於 n2 的所有相鄰邊 */
	@shrewd public get a2(): readonly TreeEdge[] { return this.adjacentEdges(this._n2); }

	/////////////////////////////////////////////////////////////////
	// 結點群組
	private group(n: TreeNode, edges: ReadonlyArray<TreeEdge>) {
		let result = [n];
		for(let edge of edges) result.push(...edge.g(n));
		return result;
	}

	/** 相對於 n1 側的結點群組 */
	@shrewd public get g1(): readonly TreeNode[] { return this.group(this._n1, this.a1); }

	/** 相對於 n2 側的結點群組 */
	@shrewd public get g2(): readonly TreeNode[] { return this.group(this._n2, this.a2); }

	/** 相反於輸入的點的那一側的結點群組 */
	public g(n: TreeNode) { return n == this._n1 ? this.g2 : this.g1; }

	/////////////////////////////////////////////////////////////////
	// 單側葉點
	@shrewd public get l1(): TreeNode[] {
		return this.g1.filter(n => n.degree == 1);
	}
	@shrewd public get l2(): TreeNode[] {
		return this.g2.filter(n => n.degree == 1);
	}

	/////////////////////////////////////////////////////////////////
	// 單側總邊長
	@shrewd private get t1(): number {
		return this.a1.map(e => e.t(this._n1) + e.length).reduce((n, x) => n + x, 0);
	}
	@shrewd private get t2(): number {
		return this.a2.map(e => e.t(this._n2) + e.length).reduce((n, x) => n + x, 0);
	}
	private t(n: TreeNode) { return n == this._n1 ? this.t2 : this.t1; }

	/////////////////////////////////////////////////////////////////
	// 單側最長路徑長
	@shrewd private get p1(): number {
		return Math.max(...this.l1.map(n => n.tree.dist(n, this.n1)));
	}
	@shrewd private get p2(): number {
		return Math.max(...this.l2.map(n => n.tree.dist(n, this.n2)));
	}

	/** 決定這條邊的環繞側 */
	@shrewd public get wrapSide(): number {
		if(!this.isRiver) return 0; // 只有河需要考慮這個問題

		// 先看最長路徑，取較短一側
		if(this.p1 > this.p2) return 2;
		if(this.p1 < this.p2) return 1;

		// 如果最長路徑一樣長，那取總長比較小的一側
		if(this.t1 > this.t2) return 2;
		if(this.t1 < this.t2) return 1;

		// 如果總長也一樣，那點數越多就表示平均長度越短
		if(this.g1.length > this.g2.length) return 1;
		if(this.g1.length < this.g2.length) return 2;

		// 還是分不出高下的話那就只好兩邊都環繞
		return 0;
	}

	/////////////////////////////////////////////////////////////////
	// 結點
	public get n1() { return this._n1; }
	public get n2() { return this._n2; }
	public n(n: TreeNode) { return n == this._n1 ? this._n2 : this._n1; }
}
