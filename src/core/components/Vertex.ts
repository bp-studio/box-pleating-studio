
interface JVertex extends IPoint {
	id: number;
	name: string;
	isNew?: boolean;
}


//////////////////////////////////////////////////////////////////
/**
 * `Vertex` 是對應於樹狀結構中的 `TreeNode` 的元件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Vertex extends IndependentDraggable implements ISerializable<JVertex> {

	public get type() { return "Vertex"; }
	public get tag() { return "v" + this.node.id; }

	public readonly node: TreeNode;
	public readonly view: VertexView;

	public readonly height = 0;
	public readonly width = 0;

	public get name() { return this.node.name; }
	public set name(n) { this.node.name = n; }

	public get degree() { return this.node.degree; }

	public selectableWith(c: Control) { return c instanceof Vertex; }

	public get dragSelectAnchor(): IPoint {
		return this.location;
	}

	protected onDragged() {
		if(this.isNew) Draggable.relocate(this, this.design.flaps.get(this.node)!);
	}

	public addLeaf(length = 1) {
		this.design.history.takeAction(() => {
			// 在新增 TreeNode 之前先把全體 Vertex 快取起來，
			// 不然等一下讀取 design.vertices 會觸發新的 Vertex 的自動生成，
			// 而那會比我設置 option 更早
			let v = [...this.design.vertices.values()];

			// 加入 TreeNode
			let node = this.node.addLeaf(length);

			// 找尋最近的空位去放
			let p = this.findClosestEmptyPoint(v);
			this.design.options.set("vertex", node.id, {
				id: node.id,
				name: node.name,
				x: p.x,
				y: p.y,
				isNew: true
			});
		});
	}

	public findClosestEmptyPoint(vertices: Vertex[]): Point {
		let { x, y } = this.location;
		let ref = new Point(x + 0.125, y + 0.0625);
		let arr: [Point, number][] = [];

		let occupied = new Set<string>();
		for(let v of vertices) occupied.add(v.location.x + "," + v.location.y);

		let r = 5;
		for(let i = x - r; i <= x + r; i++) for(let j = y - r; j <= y + r; j++) {
			if(!occupied.has(i + "," + j)) {
				let p = new Point(i, j);
				arr.push([p, p.dist(ref)]);
			}
		}
		arr.sort((a, b) => a[1] - b[1]);
		return arr[0][0];
	}

	public deleteAndJoin() {
		if(this.node.degree != 2) return;
		this.design.history.takeAction(() => {
			let edge = this.node.dispose()!;
			this.$studio?.update();
			this.design.edges.get(edge)!.selected = true;
		});
	}

	constructor(sheet: Sheet, node: TreeNode) {
		super(sheet);
		this.node = node;

		let option = sheet.design.options.get("vertex", this.node.id);
		if(option) {
			if(option.name != undefined) this.node.name = option.name;
			this.location.x = option.x;
			this.location.y = option.y;
			this.isNew = !!option.isNew;
		}

		this.view = new VertexView(this);
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.node.disposed;
	}

	public toJSON(): JVertex {
		return {
			id: this.node.id,
			name: this.name,
			x: this.location.x,
			y: this.location.y
		};
	}

	protected constraint(v: Vector, location: Readonly<IPoint>) {
		this.sheet.constraint(v, location);
		return v;
	}
}
