
@shrewd class TreeNode extends Disposable implements ITagObject {

	public static setJID(n: TreeNode, id: number) {
		n._jid = id;
	}

	public get tag() { return "n" + this.id; }

	/** 程式內部參照用的 id，這是唯讀的值，因此由於點有可能被刪除而未必連號 */
	private readonly _id: number;

	/** 輸出到 JSON 時使用的 id，這會是連號的，且順序跟 id 的順序相同 */
	private _jid: number;

	/** 自動根據當前是否正在存檔來決定傳回 id 還是 jid */
	public get id(): number {
		return this.tree.jid ? this._jid : this._id;
	}

	@action public name: string = "";

	constructor(tree: Tree, id: number) {
		super(tree);
		this.tree = tree;
		this._id = id;
	}

	@shrewd({
		renderer(this: TreeNode, n: TreeNode | null) {
			// 如果原本的父點被刪除，那自己就成為新的 root
			return n && n.disposed ? null : n;
		}
	})
	public parent: TreeNode | null = null;

	@shrewd public get parentEdge(): TreeEdge | null {
		if(!this.parent) return null
		return this.tree.edge.get(this, this.parent) ?? null;
	}

	@shrewd public get dist(): number {
		if(!this.parentEdge) return 0;
		return this.parentEdge!.length + this.parent!.dist;
	}

	@shrewd public get path(): readonly TreeNode[] {
		if(!this.parent) return [this];
		else return this.parent.path.concat(this);
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.tree.disposed;
	}

	/**
	 * @param force 是否要無視頂點度數限制、強制棄置
	 */
	public dispose(force = false) {
		if(force || this.degree == 1) super.dispose();
		else if(this.degree == 2) return this.tree.deleteAndJoin(this);
		else if(this.degree != 1) console.warn(`Node [${this.name ? this.name : this.id}] is not a leaf.`);
		return undefined;
	}

	public addLeaf(length: number): TreeNode {
		return this.tree.addLeafAt(this.id, length);
	}

	public readonly tree: Tree;

	public get design() { return this.tree.design; }

	@shrewd public get edges(): ReadonlyArray<TreeEdge> {
		this.disposeEvent();
		let e = this.tree.edge.get(this);
		return e ? Array.from(e.values()) : [];
	}

	@shrewd public get degree() {
		return this.edges.length;
	}

	@shrewd public get leafEdge() {
		return this.degree == 1 ? this.edges[0] : null;
	}

	@shrewd public get radius() {
		return this.leafEdge?.length ?? NaN;
	}
}
