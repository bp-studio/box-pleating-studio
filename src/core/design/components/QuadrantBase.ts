
//////////////////////////////////////////////////////////////////
/**
 * `QuadrantBase` 是 `Quadrant` 當中的基本抽象資料結構。
 */
//////////////////////////////////////////////////////////////////

abstract class QuadrantBase extends SheetObject {

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
	public readonly _flap: Flap;

	/** 角落方位向量 */
	public readonly qv: Vector;

	/** 起始點方位向量 */
	protected readonly sv: Vector;

	/** 起始方向向量 */
	protected readonly pv: Vector;

	public readonly fx: number;
	public readonly fy: number;

	constructor(sheet: Sheet, flap: Flap, q: QuadrantDirection) {
		super(sheet);
		this._flap = flap;
		this.q = q;

		this.qv = QuadrantBase.QV[q];
		this.sv = QuadrantBase.SV[q];
		this.pv = QuadrantBase.SV[(q + nextQuadrantOffset) % quadrantNumber];

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
	 * 在有河的情況下，計算相對於當前 `Quadrant` 的重疊區域的角落
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
	protected y(d: number) {
		return this.$point.y + this.fy * d;
	}

	/** 取得象限點沿著象限方線距離 d 的 x 座標 */
	protected x(d: number) {
		return this.$point.x + this.fx * d;
	}

	/** 把一個象限方向作相位變換處理 */
	public static $transform(dir: number, fx: number, fy: number) {
		if(fx < 0) dir += dir % 2 ? previousQuadrantOffset : nextQuadrantOffset;
		if(fy < 0) dir += dir % 2 ? nextQuadrantOffset : previousQuadrantOffset;
		return dir % quadrantNumber;
	}
}
