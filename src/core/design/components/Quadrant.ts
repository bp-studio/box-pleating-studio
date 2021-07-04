
type CoveredInfo = [number, number, Point[]];

//////////////////////////////////////////////////////////////////
/**
 * {@link Quadrant} 是負責管理一個 {@link Flap} 的其中一個象限的抽象物件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Quadrant extends SheetObject {

	/** 指著象限斜方向的向量 */
	public static readonly QV: readonly Vector[] = [
		new Vector(1, 1),
		new Vector(-1, 1),
		new Vector(-1, -1),
		new Vector(1, -1),
	];

	/** 指著象限追蹤起點方向的向量 */
	private static readonly SV: readonly Vector[] = [
		new Vector(1, 0),
		new Vector(0, 1),
		new Vector(-1, 0),
		new Vector(0, -1),
	];

	public readonly q: QuadrantDirection;
	private readonly _flap: Flap;

	/** 角落方位向量 */
	public readonly qv: Vector;

	/** 起始方向向量 */
	public readonly pv: Vector;

	/** 起始點方位向量 */
	private readonly sv: Vector;

	public readonly fx: number;
	public readonly fy: number;

	constructor(sheet: Sheet, flap: Flap, q: QuadrantDirection) {
		super(sheet);
		this._flap = flap;
		this.q = q;

		this.qv = Quadrant.QV[q];
		this.sv = Quadrant.SV[q];
		this.pv = Quadrant.SV[(q + nextQuadrantOffset) % quadrantNumber];

		this.fx = this.q == Direction.UR || this.q == Direction.LR ? 1 : -1;
		this.fy = this.q == Direction.UR || this.q == Direction.UL ? 1 : -1;
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this._flap.$disposed;
	}

	@shrewd public get $corner(): Point {
		this.$disposeEvent();
		let r = new Fraction(this._flap.radius);
		return this.$point.add(this.qv.$scale(r));
	}

	@shrewd public get $point(): Point {
		return this._flap.$points[this.q];
	}

	/**
	 * 在有河的情況下，計算相對於當前 {@link Quadrant} 的重疊區域的角落
	 *
	 * @param q 要取得哪一個未經相位變換之前的角
	 * @param d 額外距離
	 */
	public $getOverlapCorner(ov: JOverlap, parent: JJunction, q: number, d: number): Point {
		let r = this._flap.radius + d;
		let sx = ov.shift?.x ?? 0;
		let sy = ov.shift?.y ?? 0;

		// 如果當前的 Quadrant 是位於 parent 的對面方向，則位置要相反計算
		if(this._flap.node.id != parent.c[0].e) {
			sx = parent.ox - (ov.ox + sx);
			sy = parent.oy - (ov.oy + sy);
		}

		return new Point(
			this.x(r - (q == Direction.LR ? 0 : ov.ox) - sx),
			this.y(r - (q == Direction.UL ? 0 : ov.oy) - sy)
		);
	}

	/** 取得象限點沿著象限方線距離 d 的 y 座標 */
	public y(d: number): number {
		return this.$point.y + this.fy * d;
	}

	/** 取得象限點沿著象限方線距離 d 的 x 座標 */
	public x(d: number): number {
		return this.$point.x + this.fx * d;
	}

	/** 把一個象限方向作相位變換處理 */
	public static $transform(dir: number, fx: number, fy: number): Direction {
		if(fx < 0) dir += dir % 2 ? previousQuadrantOffset : nextQuadrantOffset;
		if(fy < 0) dir += dir % 2 ? nextQuadrantOffset : previousQuadrantOffset;
		return dir % quadrantNumber;
	}

	@shrewd public get $pattern(): Pattern | null {
		let stretch = this.$design.$stretches.$getByQuadrant(this);
		return stretch ? stretch.$pattern : null;
	}

	@orderedArray("qvj") private get _validJunctions(): readonly Junction[] {
		return this._flap.$validJunctions.filter(j => this.$isInJunction(j));
	}

	@orderedArray("qcj") public get $coveredJunctions(): readonly Junction[] {
		return this._validJunctions.filter(j => j.$isCovered);
	}

	@noCompare public get $coveredInfo(): readonly CoveredInfo[] {
		return this.$coveredJunctions.map(j =>
			[j.ox, j.oy, j.$coveredBy.map(c => c.q1!.q == this.q ? c.q1!.$point : c.q2!.$point)]
		);
	}

	/** 傳回此向量目前所有的活躍 {@link Junction} 物件 */
	@orderedArray("qaj") public get $activeJunctions(): readonly Junction[] {
		return this._validJunctions.filter(j => !j.$isCovered);
	}

	/** 將指定的 {@link Junction} 移動到指定的基準點上，取得覆蓋比較矩形 */
	public $getBaseRectangle(j: Junction, base: TreeNode): Rectangle {
		let distance = this.$design.$tree.$dist(base, this._flap.node);
		let radius = this._flap.radius;
		let shift = this.qv.$scale(new Fraction(distance - radius));
		return new Rectangle(
			new Point(this.x(radius), this.y(radius)).addBy(shift),
			new Point(this.x(radius - j.ox), this.y(radius - j.oy)).addBy(shift)
		);
	}

	public $isInJunction(j: Junction): boolean {
		return j.q1 == this || j.q2 == this;
	}

	public $getOppositeQuadrant(j: Junction): Quadrant {
		return j.q1 == this ? j.q2! : j.q1!;
	}

	public $distTriple(q1: Quadrant, q2: Quadrant): { d1: number, d2: number, d3: number } {
		return this.$design.$tree.$distTriple(this._flap.node, q1._flap.node, q2._flap.node);
	}

	/** 產生此象限距離 d（不含半徑）的逆時鐘順序輪廓 */
	public $makeContour(d: number): Path {
		let contourRadius = this._flap.radius + d;
		let contourRadiusFraction = new Fraction(contourRadius);
		let startPt = this.$getStart(contourRadiusFraction);
		let pattern = this.$pattern;
		let trace: Path;

		if(!pattern) {
			trace = [startPt, this.$point.add(this.qv.$scale(contourRadiusFraction))];
		} else {
			let initDisplacement = this.sv.$scale(contourRadiusFraction);
			let endPt = this.$point.add(initDisplacement.$rotate90());
			let junctions = pattern.$stretch.$junctions;
			let lines = pattern.$linesForTracing[this.q];
			trace = new TraceBuilder(this, junctions, lines, startPt, endPt).$build(contourRadius);
		}

		// 底下這一行是用來偵錯數值爆表用的
		// if(trace.some(p => p._x.$isDangerous || p._y.$isDangerous)) console.log("danger");

		return trace;
	}

	/** 產生此象限距離 d（含半徑！）的輪廓起點 */
	public $getStart(d: Fraction): Point {
		return this.$point.add(this.sv.$scale(d));
	}

	/** 指定的點是否是在非法導繪模式中產生的無效點 */
	public $isInvalidHead(p: Point, r: number, x: boolean): boolean {
		if(!p) return false;
		let prevQ = this._flap.$quadrants[(this.q + previousQuadrantOffset) % quadrantNumber];
		return (x ?
			(p.y - this.$point.y) * this.fy < 0 && p.x == this.x(r) :
			(p.x - this.$point.x) * this.fx < 0 && p.y == this.y(r)) &&
			prevQ.$outside(p, r, !x);
	}

	/** 指定的點是否某個座標超過了自身的給定半徑範圍 */
	public $outside(p: Point, r: number, x: boolean): boolean {
		if(!p) return false;
		return x ? p.x * this.fx > this.x(r) * this.fx : p.y * this.fy > this.y(r) * this.fy;
	}

	public $findJunction(that: Quadrant): Junction {
		return this.$design.$junctions.get(this._flap, that._flap)!;
	}

	/**
	 * 偵錯用；列印 makeContour(d) 的過程
	 *
	 * @exports
	 */
	public debug(d: number = 0): void {
		debug = true;
		console.log(this.$makeContour(d).map(p => p.toString()));
		debug = false;
	}
}
