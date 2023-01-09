import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link ArcSegment} 類別代表一個弧線。
 */
//=================================================================

export class ArcSegment implements ISegment {
	public readonly $polygon: number;
	public $center: IPoint;
	public $radius: number;
	private _start: IPoint;
	private _end: IPoint;
	private _out!: IPoint;
	private _delta!: IPoint;

	public constructor(c: IPoint, r: number, s: IPoint, e: IPoint, polygon: number) {
		this.$polygon = polygon;
		this.$center = c;
		this.$radius = r;
		this._start = s;
		this._end = e;
		this._updateVectors();
	}

	public get $start(): IPoint {
		return this._start;
	}
	public set $start(p: IPoint) {
		this._start = p;
		this._updateVectors();
	}

	public get $end(): IPoint {
		return this._end;
	}
	public set $end(p: IPoint) {
		this._end = p;
		this._updateVectors();
	}

	public $contains(p: IPoint): boolean {
		const dx = p.x - this.$center.x;
		const dy = p.y - this.$center.y;
		if(dx * dx + dy * dy !== this.$radius * this.$radius) return false;
		return this._inArcRange(p);
	}

	public $intersection(that: ArcSegment): IPoint[] {
		return this._intersection(that).filter(p => this._inArcRange(p));
	}

	private _intersection(that: ArcSegment): IPoint[] {
		// https://math.stackexchange.com/a/1033561
		const { x: x1, y: y1 } = this.$center, r1 = this.$radius;
		const { x: x2, y: y2 } = that.$center, r2 = that.$radius;
		const dx = x1 - x2;
		const dy = y1 - y2;
		const r = r1 + r2;
		const ds = dx * dx + dy * dy;
		if(ds > r * r) return []; // Too far

		const d = Math.sqrt(ds);
		const l = (r1 * r1 - r2 * r2 + ds) / d / 2;
		if(l > r1) return []; // Too close

		const h = Math.sqrt(r1 * r1 - l * l);

		if(h === 0) return [{ x: x1 - dx * l / d, y: y1 - dy * l / d }];
		return [
			{ x: x1 - (dx * l + dy * h) / d, y: y1 - (dy * l - dx * h) / d },
			{ x: x1 - (dx * l - dy * h) / d, y: y1 - (dy * l + dx * h) / d },
		];
	}

	/** 更新比較用的向量 */
	private _updateVectors(): void {
		const e = this._end, s = this._start, c = this.$center;
		this._delta = { x: e.x - s.x, y: e.y - s.y };
		this._out = { x: (e.x + s.x) / 2 - c.x, y: (e.y + s.y) / 2 - c.y };
	}

	/** 利用向量的原理快速檢查傳入的點是否在弧線的範圍內，而不牽涉到 atan 計算 */
	private _inArcRange(p: IPoint): boolean {
		// 要位於正確的一側
		if((p.x - this.$center.x) * this._out.x + (p.y - this.$center.y) * this._out.y <= 0) return false;

		// 要位於起點跟終點之間
		const { x, y } = this._delta;
		const weight = ((p.x - this._start.x) * x + (p.y - this._start.y) * y) / (x * x + y * y);
		return weight > 0 && weight < 1;
	}
}
