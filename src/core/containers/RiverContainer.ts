
class RiverContainer extends BaseContainer<TreeEdge, River> {
	constructor(design: Design) {
		super(
			design,
			() => [...design.tree.edge.values()].filter(e => e.isRiver),
			e => new River(design.LayoutSheet, e)
		);
	}

	public toEdge(river: River) {
		this._design.TreeSheet.clearSelection();
		let e = this._design.edges.get(river.edge);
		if(e) e.selected = true;
		this._design.mode = "tree";
	}
}
