
//////////////////////////////////////////////////////////////////
/**
 * `River` 是摺痕圖中對應於一條河的區域，它可以被選取，
 * 但其配置是間接被 `Flap` 的位置所決定出來的，不能自由移動。
 */
//////////////////////////////////////////////////////////////////

@shrewd class River extends Control {

	public get $type() { return "River"; }

	public get $tag() { return "r" + this.edge.$tag; }

	/** @exports */
	public readonly edge: TreeEdge;

	constructor(sheet: Sheet, edge: TreeEdge) {
		super(sheet);
		this.edge = edge;
		this.$design.$viewManager.$createView(this);
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.edge.$disposed || !this.edge.$isRiver;
	}

	public $delete(): boolean {
		// 裡面有 action，因此這邊不用加上
		let edge = this.$design.$edges.get(this.edge);
		if(!edge) return false;
		return edge.deleteAndMerge();
	}

	/** @exports */
	public get length() { return this.edge.length; }
	public set length(v) { this.edge.length = v; }
}
