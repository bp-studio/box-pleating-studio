
@shrewd class VertexContainer extends BaseContainer<TreeNode, Vertex> {

	constructor(design: Design) {
		super(
			design,
			() => design.$tree.$node.values(),
			n => new Vertex(design.$TreeSheet, n)
		);
	}

	public $delete(vertices: readonly Vertex[]): boolean {
		let success = false;
		let arr = vertices.concat().sort((a, b) => a.$node.$degree - b.$node.$degree);
		while(this.size > Design.$MIN_NODES) {
			let vertex = arr.find(v => v.$node.$degree == 1);
			if(!vertex) break;
			vertex.$node.$delete();
			arr.splice(arr.indexOf(vertex), 1);
			success = true;
		}
		return success;
	}

	public $selectAll() {
		this.forEach(f => f.$selected = true);
	}

	public $toFlap(vertices: Vertex[]) {
		this._design.$LayoutSheet.$clearSelection();
		for(let vertex of vertices) {
			let flap = this._design.$flaps.get(vertex.$node);
			if(flap) flap.$selected = true;
		}
		this._design.mode = "layout";
	}
}
