
class EdgeContainer extends BaseContainer<TreeEdge, Edge> {

	constructor(design: Design) {
		super(
			design,
			() => design.tree.edge.values(),
			e => new Edge(design.TreeSheet, design.vertices.get(e.n1)!, design.vertices.get(e.n2)!, e)
		);
	}

	/**
	 * 把 `this.edges.toJSON()` 產出的 `JEdge[]` 做一個排序，
	 * 使得從第一條邊開始逐一加入邊都能維持連通性，且 parent 的方向正確。
	 */
	public sort(): JEdge[] {
		let edges = this.toJSON();
		let nodes = new Set<number>();
		let result: JEdge[] = [];
		while(edges.length) {
			let e = edges.shift()!;
			if(nodes.size == 0 || nodes.has(e.n1)) {
				result.push(e);
				nodes.add(e.n1);
				nodes.add(e.n2);
			} else edges.push(e);
		}
		return result;
	}

	public toRiver(edge: Edge) {
		this._design.LayoutSheet.clearSelection();
		let te = edge.edge;
		if(te.isRiver) {
			let r = this._design.rivers.get(te);
			if(r) r.selected = true;
		} else {
			let n = te.n1.degree == 1 ? te.n1 : te.n2;
			let f = this._design.flaps.get(n);
			if(f) f.selected = true;
		}
		this._design.mode = "layout";
	}
}
