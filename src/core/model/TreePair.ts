
//////////////////////////////////////////////////////////////////
/**
 * TreePair 是負責管理一對 TreeNode 的相對關係的物件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class TreePair extends Disposable {

	private readonly _n1: TreeNode;
	private readonly _n2: TreeNode;

	constructor(n1: TreeNode, n2: TreeNode) {
		super();
		this._n1 = n1;
		this._n2 = n2;
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this._n1.disposed || this._n2.disposed;
	}

	@shrewd public get lca(): TreeNode {
		this.disposeEvent();

		let [n1, n2] = [this._n1, this._n2];
		if(n1.depth < n2.depth) [n1, n2] = [n2, n1];	// 排序成 n1 低於 n2
		if(n2.depth == 0) return n2;					// 如果 n2 根本就是根，直接傳回
		while(n1.depth > n2.depth) n1 = n1.parent!;		// 回朔到 n1 n2 同高
		if(n1 == n2) return n1;							// 如果一樣，那這個自動就是 lca

		let a1 = n1.parent!, a2 = n2.parent!;
		if(a1 == a2) return a1;
		return n1.tree.pair.get(a1, a2)!.lca;
	}

	// 這個數值做成反應方法的意義有限，所以做成單純的存取子
	public get dist(): number {
		return this._n1.dist + this._n2.dist - 2 * this.lca.dist;
	}
}
