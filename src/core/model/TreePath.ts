
@shrewd class TreePath extends Disposible {

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

	@shrewd private get edges() {
		let result: TreeEdge[] = [];
		let now = this._n1;
		let ok = true;
		while(now != this._n2 && ok) {
			ok = false;
			for(let e of now.edges) {
				if(e.g(now).includes(this._n2)) {
					ok = true;
					result.push(e);
					now = e.n(now);
					break;
				}
			}
		}
		return result;
	}

	@shrewd public get length(): number {
		return this.edges.reduce((l, e) => l + e.length, 0);
	}
}