import { SegmentType } from "./segment";
import { xyComparator } from "shared/types/geometry";

import type { ISegment } from "./segment";

/**
 * 跟弧線計算有關的 epsilon。
 * 以這邊的應用來說，這個寧可取大一點，也不要把浮點誤差視為真的相異。
 *
 * 幾個常用的比較之 epsilon 對等型式：
 *
 * ```
 * x > 0  => x > EPSILON
 * x >= 0 => x > -EPSILON
 * x == 0 => Math.abs(x) < EPSILON
 * x <= 0 => x < EPSILON
 * x < 0  => x < -EPSILON
 * ```
 */
export const EPSILON = 1e-10;

//=================================================================
/**
 * {@link ArcSegment} 類別代表一個弧線。
 */
//=================================================================

export class ArcSegment implements ISegment {
	public readonly $type = SegmentType.Arc;
	public readonly $polygon: number;
	public readonly $center: Readonly<IPoint>;
	public readonly $radius: number;
	private _start: Readonly<IPoint>;
	private _end: Readonly<IPoint>;
	private _out!: Readonly<IPoint>;
	private _delta!: Readonly<IPoint>;

	/** 圓弧控制點（兩切線的交點） */
	public $anchor!: IPoint;

	public constructor(c: IPoint, r: number, s: IPoint, e: IPoint, polygon: number) {
		this.$polygon = polygon;
		this.$center = c;
		this.$radius = r;
		this._start = s;
		this._end = e;
		this._update();
	}

	public get $start(): Readonly<IPoint> {
		return this._start;
	}
	public set $start(p: Readonly<IPoint>) {
		this._start = p;
		this._update();
	}

	public get $end(): IPoint {
		return this._end;
	}
	public set $end(p: IPoint) {
		this._end = p;
		this._update();
	}

	public $subdivide(point: IPoint, oriented: boolean): ISegment {
		let newSegment: ArcSegment;
		if(oriented) {
			newSegment = new ArcSegment(this.$center, this.$radius, point, this.$end, this.$polygon);
			this.$end = point;
		} else {
			newSegment = new ArcSegment(this.$center, this.$radius, this.$start, point, this.$polygon);
			this.$start = point;
		}
		this._update();
		return newSegment;
	}

	/** 找出兩個圓的交點（先假定是全圓） */
	public *$intersection(that: ArcSegment): IterableIterator<IPoint> {
		// https://math.stackexchange.com/a/1033561
		const { x: x1, y: y1 } = this.$center, r1 = this.$radius;
		const { x: x2, y: y2 } = that.$center, r2 = that.$radius;
		const dx = x1 - x2;
		const dy = y1 - y2;
		if(!dx && !dy) return;
		const r = r1 + r2;
		const ds = dx * dx + dy * dy;
		if(ds > r * r) return; // Too far

		const d = Math.sqrt(ds);
		const l = (r1 * r1 - r2 * r2 + ds) / d / 2;
		if(l > r1) return; // Too close

		const h = Math.sqrt(r1 * r1 - l * l);

		if(h === 0) {
			yield { x: x1 - dx * l / d, y: y1 - dy * l / d };
		} else {
			const result = [
				{ x: x1 - (dx * l + dy * h) / d, y: y1 - (dy * l - dx * h) / d },
				{ x: x1 - (dx * l - dy * h) / d, y: y1 - (dy * l + dx * h) / d },
			];
			result.sort(xyComparator);
			yield result[0];
			yield result[1];
		}
	}

	/**
	 * 利用向量的原理快速檢查傳入的點是否在弧線的範圍內，而不牽涉到 atan 計算；
	 * 傳回負值表示在內部，零表示在端點，正值表示在外面
	 */
	public $inArcRange(p: IPoint): number {
		// 要位於正確的一側（理論上會差很多，所以不用 epsilon）
		if((p.x - this.$center.x) * this._out.x + (p.y - this.$center.y) * this._out.y <= 0) return 1;

		// 要位於起點跟終點之間
		const { x, y } = this._delta;
		const weight = ((p.x - this._start.x) * x + (p.y - this._start.y) * y) / (x * x + y * y);
		return weight * (weight - 1);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 更新比較用的向量等等 */
	private _update(): void {
		const e = this._end, s = this._start, c = this.$center;
		this._delta = { x: e.x - s.x, y: e.y - s.y };
		let r = (e.y - s.y) / (s.x + e.x - 2 * c.x);
		r = 1 + r * r;
		this._out = { x: ((e.x + s.x) / 2 - c.x) * r, y: ((e.y + s.y) / 2 - c.y) * r };
		this.$anchor = { x: c.x + this._out.x, y: c.y + this._out.y };
	}
}
