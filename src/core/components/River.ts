
//////////////////////////////////////////////////////////////////
/**
 * `River` 是摺痕圖中對應於一條河的區域，它可以被選取，
 * 但其配置是間接被 `Flap` 的位置所決定出來的，不能自由移動。
 */
//////////////////////////////////////////////////////////////////

@shrewd class River extends ViewedControl {

	public get type() { return "River"; }

	public readonly view: RiverView;

	public readonly edge: TreeEdge;

	constructor(sheet: Sheet, edge: TreeEdge) {
		super(sheet);
		this.edge = edge;
		this.view = new RiverView(this);
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.edge.disposed || !this.edge.isRiver;
	}

	public delete(): void {
		// 裡面有 action，因此這邊不用加上
		this.design.edges.get(this.edge)!.deleteAndMerge();
	}

	public get length() { return this.edge.length; };
	public set length(v) { this.edge.length = v; }
}
