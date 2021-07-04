
interface JEdge {
	n1: number;
	n2: number;
	length: number;
	selected?: boolean;
}

@shrewd class TreeEdge extends Disposable implements ITagObject, ISerializable<JEdge> {

	public get $tag(): string { return "e" + this.n1.id + "," + this.n2.id; }

	public readonly n1: TreeNode;
	public readonly n2: TreeNode;

	/** @exports */
	@action({ validator: (v: number) => v > 0 }) public length: number;

	constructor(n1: TreeNode, n2: TreeNode, length: number) {
		super();
		this.n1 = n1;
		this.n2 = n2;
		this.length = length;
	}

	public $dispose(force: boolean = false): void {
		if(force) this.$design.$tree.$edge.delete(this.n1, this.n2);
		super.$dispose();
	}

	public toJSON(): JEdge {
		let [n1, n2] = [this.n1, this.n2];
		// 考慮到 JID，這邊要用 parent.id 而非 parentId
		if(n1.$parent?.id === n2.id) [n1, n2] = [n2, n1];
		return {
			n1: n1.id,
			n2: n2.id,
			length: this.length,
		};
	}

	public get tree(): Tree { return this.n1.$tree; }
	public get $design(): Design { return this.n1.$design; }

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.n1.$disposed || this.n2.$disposed;
	}

	public $delete(): boolean {
		let node = [this.n1, this.n2].find(n => n.$degree == 1);
		if(node) {
			node.$dispose();
			return true;
		}
		return false;
	}

	@shrewd public get $isRiver(): boolean {
		this.$disposeEvent();
		return this.n1.$degree > 1 && this.n2.$degree > 1;
	}

	/////////////////////////////////////////////////////////////////
	// 相鄰邊
	private _adjacentEdges(n: TreeNode): TreeEdge[] { return n.edges.filter(e => e != this); }

	/** 相對於 n1 的所有相鄰邊 */
	@shrewd public get a1(): readonly TreeEdge[] {
		this.$disposeEvent();
		return this._adjacentEdges(this.n1);
	}

	/** 相對於 n2 的所有相鄰邊 */
	@shrewd public get a2(): readonly TreeEdge[] {
		this.$disposeEvent();
		return this._adjacentEdges(this.n2);
	}

	/////////////////////////////////////////////////////////////////
	// 結點群組
	private static _group(n: TreeNode, edges: ReadonlyArray<TreeEdge>): TreeNode[] {
		let result = [n];
		for(let edge of edges) result.push(...edge.g(n));
		return result;
	}

	/** 相對於 n1 側的結點群組 */
	@shrewd public get g1(): readonly TreeNode[] {
		this.$disposeEvent();
		return TreeEdge._group(this.n1, this.a1);
	}

	/** 相對於 n2 側的結點群組 */
	@shrewd public get g2(): readonly TreeNode[] {
		this.$disposeEvent();
		return TreeEdge._group(this.n2, this.a2);
	}

	/** 相反於輸入的點的那一側的結點群組 */
	public g(n: TreeNode): readonly TreeNode[] { return n == this.n1 ? this.g2 : this.g1; }

	/////////////////////////////////////////////////////////////////
	// 單側葉點
	@shrewd public get l1(): TreeNode[] {
		this.$disposeEvent();
		return this.g1.filter(n => n.$degree == 1);
	}
	@shrewd public get l2(): TreeNode[] {
		this.$disposeEvent();
		return this.g2.filter(n => n.$degree == 1);
	}

	/////////////////////////////////////////////////////////////////
	// 單側總邊長
	@shrewd private get t1(): number {
		this.$disposeEvent();
		return sum(this.a1.map(e => e.t(this.n1) + e.length));
	}
	@shrewd private get t2(): number {
		this.$disposeEvent();
		return sum(this.a2.map(e => e.t(this.n2) + e.length));
	}
	private t(n: TreeNode): number { return n == this.n1 ? this.t2 : this.t1; }

	/////////////////////////////////////////////////////////////////
	// 單側最長路徑長
	@shrewd private get p1(): number {
		this.$disposeEvent();
		return Math.max(...this.l1.map(n => n.$tree.$dist(n, this.n1)));
	}
	@shrewd private get p2(): number {
		this.$disposeEvent();
		return Math.max(...this.l2.map(n => n.$tree.$dist(n, this.n2)));
	}

	/** 決定這條邊的環繞側 */
	@shrewd public get $wrapSide(): number {
		this.$disposeEvent();
		if(!this.$isRiver) return 0; // 只有河需要考慮這個問題

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
	public n(n: TreeNode): TreeNode { return n == this.n1 ? this.n2 : this.n1; }
}
