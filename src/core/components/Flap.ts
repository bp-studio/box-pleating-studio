
interface JFlap {
	id: number;
	width: number;
	height: number;
	x: number;
	y: number;
}

//////////////////////////////////////////////////////////////////
/**
 * `Flap` 是摺痕圖中的角片元件，是決定整個摺痕圖配置的關鍵。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Flap extends IndependentDraggable implements ISerializable<JFlap> {

	public get type() { return "Flap"; }
	public get tag() { return "f" + this.node.id; }

	@action({
		validator(this: Flap, v: number) {
			let ok = v >= 0 && v <= this.sheet.width;
			let d = this.location.x + v - this.sheet.width;
			if(d > 0) this.location.x -= d;
			return ok;
		}
	})
	public width: number = 0;

	@action({
		validator(this: Flap, v: number) {
			let ok = v >= 0 && v <= this.sheet.height;
			let d = this.location.y + v - this.sheet.height;
			if(d > 0) this.location.y -= d;
			return ok;
		}
	})
	public height: number = 0;

	public readonly node: TreeNode;

	public readonly view: FlapView;

	public readonly quadrants: PerQuadrant<Quadrant>;

	public selectableWith(c: Control) { return c instanceof Flap; }

	@shrewd public get dragSelectAnchor() {
		return { x: this.location.x + this.width / 2, y: this.location.y + this.height / 2 };
	}

	/** 這個 Flap 的各象限上的頂點 */
	@shrewd public get points(): readonly Point[] {
		let x = this.location.x, y = this.location.y;
		let w = this.width, h = this.height;
		return [
			new Point(x + w, y + h),
			new Point(x, y + h),
			new Point(x, y),
			new Point(x + w, y)
		];
	}

	public get name() { return this.node.name; }
	public set name(n) { this.node.name = n; }

	public get radius() { return this.node.radius; }
	public set radius(r) {
		let e = this.node.leafEdge;
		if(e) e.length = r;
	}

	constructor(sheet: Sheet, node: TreeNode) {
		super(sheet);
		this.node = node;

		let design = sheet.design;
		let option = design.options.get("flap", node.id);
		if(option) {
			// 找得到設定就用設定值
			this.location.x = option.x;
			this.location.y = option.y;
			this.width = option.width;
			this.height = option.height;
			this.isNew = false;
		} else {
			// 否則根據對應的頂點的位置來粗略估計初始化
			Draggable.relocate(design.vertices.get(this.node)!, this);
		}

		this.quadrants = MakePerQuadrant(i => new Quadrant(sheet, this, i));
		this.view = new FlapView(this);
	}

	protected onDragged() {
		if(this.isNew) Draggable.relocate(this, this.design.vertices.get(this.node)!);
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.node.disposed || this.node.degree != 1;
	}

	public toJSON(): JFlap {
		return {
			id: this.node.id,
			width: this.width,
			height: this.height,
			x: this.location.x,
			y: this.location.y
		};
	}

	protected constraint(v: Vector, location: Readonly<IPoint>) {
		this.sheet.constraint(v, location);
		this.sheet.constraint(v, {
			x: location.x + this.width,
			y: location.y + this.height
		});
		return v;
	}

	////////////////////////////////////////////////////////////
	/**
	 * 底下這一部份的程式碼負責整理一個 Flap 具有哪些 Junction。
	 * 因為 Junction 的總數非常多，採用純粹的反應式框架來篩選反而速度慢，
	 * 因此特別這一部份改用一個主動式架構來通知 Flap.junctions 的更新。
	 */
	////////////////////////////////////////////////////////////

	public readonly $junctions: Junction[] = [];
	public $junctionChanged: boolean = false;

	@shrewd({
		comparer(this: Flap) {
			let result = this.$junctionChanged;
			this.$junctionChanged = false;
			return !result;
		}
	})
	public get junctions(): readonly Junction[] {
		this.design.junctions;
		return this.$junctions;
	}

	@noCompare get validJunctions(): readonly Junction[] {
		return this.junctions.filter(j => j.isValid);
	}
}
