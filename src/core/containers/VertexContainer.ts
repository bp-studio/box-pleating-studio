
class VertexContainer extends BaseContainer<TreeNode, Vertex> {

	constructor(design: Design) {
		super(
			design,
			() => design.tree.node.values(),
			n => new Vertex(design.TreeSheet, n)
		);
	}


	@exported public delete(vertices: readonly Vertex[]) {
		let arr = vertices.concat().sort((a, b) => a.node.degree - b.node.degree);
		while(this.size > 3) {
			let v = arr.find(v => v.node.degree == 1);
			if(!v) break;
			v.node.delete();
			arr.splice(arr.indexOf(v), 1);
		}
	}

	public selectAll() {
		this.forEach(f => f.selected = true);
	}

	@exported public toFlap(vertices: Vertex[]) {
		this._design.LayoutSheet.clearSelection();
		for(let v of vertices) {
			let f = this._design.flaps.get(v.node)
			if(f) f.selected = true;
		}
		this._design.mode = "layout";
	}
}
