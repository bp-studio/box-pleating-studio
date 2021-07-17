
interface JVertex extends IPoint {
	id: number;
	name: string;
	isNew?: boolean;
	selected?: boolean;
}


//////////////////////////////////////////////////////////////////
/**
 * {@link Vertex} 是對應於樹狀結構中的 {@link TreeNode} 的元件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Vertex extends IndependentDraggable implements ISerializable<JVertex> {

	public get $type(): string { return "Vertex"; }
	public get $tag(): string { return "v" + this.$node.id; }

	public readonly $node: TreeNode;

	constructor(sheet: Sheet, node: TreeNode) {
		super(sheet);
		this.$node = node;

		let option = sheet.$design.$options.get(this);
		if(option) {
			if(option.name != undefined) this.$node.name = option.name;
			this.$location.x = option.x;
			this.$location.y = option.y;
			this.$isNew = Boolean(option.isNew);
			this.$selected = Boolean(option.selected);
		}

		sheet.$design.$viewManager.$createView(this);

		sheet.$design.$history?.$construct(this.$toMemento());
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$node.$disposed;
	}

	protected $onDispose(): void {
		this.$design?.$history?.$destruct(this.$toMemento());
		super.$onDispose();
	}

	/** @exports */
	public readonly height = 0;

	/** @exports */
	public readonly width = 0;

	/** @exports */
	public get name(): string { return this.$node.name; }
	public set name(n: string) { this.$node.name = n; }

	/** @exports */
	public get degree(): number { return this.$node.$degree; }

	public $selectableWith(c: Control): boolean { return c instanceof Vertex; }

	public get $dragSelectAnchor(): IPoint {
		return this.$location;
	}

	protected $onDragged(): void {
		if(this.$isNew) Draggable.$relocate(this, this.$design.$flaps.get(this.$node)!);
	}

	/** @exports */
	public addLeaf(length = 1): void {
		// 在新增 TreeNode 之前先把全體 Vertex 快取起來，
		// 不然等一下讀取 design.vertices 會觸發新的 Vertex 的自動生成，
		// 而那會比我設置 option 更早
		let v = [...this.$design.$vertices.values()];

		// 加入 TreeNode
		let node = this.$node.$addLeaf(length);

		// 找尋最近的空位去放
		let p = this.$findClosestEmptyPoint(v);
		this.$design.$options.set("v" + node.id, {
			id: node.id,
			name: node.name,
			x: p.x,
			y: p.y,
			isNew: true,
		});
	}

	/** 根據所有的頂點集，找出自身附近最近的空白處 */
	public $findClosestEmptyPoint(vertices: Vertex[]): Point {
		let { x, y } = this.$location;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		let ref = new Point(x + 0.125, y + 0.0625);
		let arr: [Point, number][] = [];

		let occupied = new Set<string>();
		for(let v of vertices) occupied.add(v.$location.x + "," + v.$location.y);

		let r = 5;
		for(let i = x - r; i <= x + r; i++) {
			for(let j = y - r; j <= y + r; j++) {
				if(!occupied.has(i + "," + j)) {
					let p = new Point(i, j);
					arr.push([p, p.$dist(ref)]);
				}
			}
		}
		arr.sort((a, b) => a[1] - b[1]);
		return arr[0][0];
	}

	/** @exports */
	public delete(): void {
		this.$node.$delete();
	}

	/** @exports */
	public deleteAndJoin(): void {
		if(this.$node.$degree != 2) return;
		let edge = this.$node.$dispose()!;
		let json = edge.toJSON();
		json.selected = true;
		this.$design.$options.set(edge.$tag, json);
	}

	public $toMemento(): Memento {
		return [this.$tag, this.toJSON()];
	}

	public toJSON(): JVertex {
		return {
			id: this.$node.id,
			name: this.name,
			x: this.$location.x,
			y: this.$location.y,
		};
	}

	protected $constraint(v: Vector, location: Readonly<IPoint>): Vector {
		this.$sheet.$constraint(v, location);
		return v;
	}
}
