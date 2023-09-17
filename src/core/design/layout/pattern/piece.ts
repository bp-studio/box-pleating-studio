import { Region } from "./region";
import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";
import { Line } from "core/math/geometry/line";
import { cache, clearCache } from "core/utils/cache";
import { nonEnumerable } from "shared/utils/nonEnumerable";
import { toLines } from "core/math/geometry/rationalPath";
import { clone } from "shared/utils/clone";

import type { PerQuadrant } from "shared/types/direction";
import type { Gadget } from "./gadget";
import type { IRegionShape } from "./region";
import type { JPiece } from "shared/json";

//=================================================================
/**
 * {@link Piece} is a {@link Region} in a {@link Gadget}.
 */
//=================================================================
export class Piece extends Region implements JPiece {

	public ox: number;

	public oy: number;

	public u: number;

	public v: number;

	public detours?: IPoint[][];

	public shift?: IPoint;

	@nonEnumerable private _offset?: IPoint = { x: 0, y: 0 };

	constructor(data: JPiece) {
		super();
		this.ox = data.ox;
		this.oy = data.oy;
		this.u = data.u;
		this.v = data.v;
		this.detours = data.detours;
		this.shift = data.shift;
	}

	public $offset(o?: IPoint): void {
		if(!o || this._offset && this._offset.x == o.x && this._offset.y == o.y) return;
		this._offset = o;
		clearCache(this);
	}

	public get sx(): number {
		return this.oy + this.u + this.v;
	}

	public get sy(): number {
		return this.ox + this.u + this.v;
	}

	/** Reverse self under the given SCR. */
	public $reverse(tx: number, ty: number): void {
		const { detours, sx, sy } = this;
		let { shift } = this;
		shift = shift || { x: 0, y: 0 };
		const s = { x: tx - sx - shift.x, y: ty - sy - shift.y };
		if(s.x || s.y) this.shift = s;
		this.detours = detours?.map(c =>
			c.map(p => ({ x: sx - p.x, y: sy - p.y }))
		);
	}

	/** Shrink a {@link Piece} proportionally. This will reset the cache. */
	public $shrink(by: number = 2): this {
		clearCache(this);
		this.ox /= by;
		this.oy /= by;
		this.u /= by;
		this.v /= by;
		return this;
	}

	/**
	 * Add a {@link Piece.detour}. Resets all cached values.
	 *
	 * The added detour will be cloned.
	 * Its coordinates should not incorporate the offset.
	 */
	public $addDetour(detour: IPoint[]): void {
		detour = clone(detour);
		// Precondition check
		for(let i = 0; i < detour.length - 1; i++) {
			if(detour[i].x == detour[i + 1].x && detour[i].y == detour[i + 1].y) {
				detour.splice(i--, 1);
			}
		}
		if(detour.length == 1) return;

		// Add the detour for real
		this.detours = this.detours || [];
		this.detours.push(detour);
		clearCache(this);
	}

	public $clearDetour(): void {
		if(this.detours?.length) {
			this.detours = undefined;
			clearCache(this);
		}
	}


	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@cache public get $anchors(): PerQuadrant<Point | null> {
		const p = this._points;
		const { contour } = this.$shape;
		return [
			contour.some(c => c.eq(p[0])) ? p[0] : null,
			contour.includes(p[1]) ? p[1] : null,
			contour.some(c => c.eq(p[2])) ? p[2] : null,
			contour.includes(p[3]) ? p[3] : null,
		];
	}

	@cache public get $direction(): Vector {
		const { oy, v } = this;
		return new Vector(oy + v, v).$doubleAngle().$reduceToInt();
	}

	@cache public get $shape(): IRegionShape {
		const contour = this._points.concat();
		const ridges = toLines(contour);
		(this.detours || []).forEach(d => this._processDetour(ridges, contour, d));
		return { contour, ridges };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@cache private get _points(): Point[] {
		const { ox, oy, u, v } = this;

		// A GOPS is like the reverse of the Overlap region,
		// therefore the corners are arranged in clockwise direction,
		// starting from the lower left.
		const result = [
			Point.ZERO,
			new Point(u, ox + u),
			new Point(oy + u + v, ox + u + v),
			new Point(oy + v, v),
		];
		result.forEach(p => p.addBy(this._shift));
		return result;
	}

	@cache private get _shift(): Vector {
		return new Vector(
			(this.shift?.x ?? 0) + (this._offset?.x ?? 0),
			(this.shift?.y ?? 0) + (this._offset?.y ?? 0)
		);
	}

	private _processDetour(ridges: Line[], contour: Point[], d: IPoint[]): void {
		const detour = d.map(p => new Point(p.x, p.y).addBy(this._shift));
		const start = detour[0], end = detour[detour.length - 1];

		const lines: Line[] = [];
		for(let i = 0; i < detour.length - 1; i++) {
			lines.push(new Line(detour[i], detour[i + 1]));
		}

		// Find corresponding position of the detour
		const l = ridges.length;
		for(let i = 0; i < l; i++) {
			const eq = ridges[i].p1.eq(start);
			if(!eq && !ridges[i].$contains(start)) continue;

			for(let j = 1; j < l; j++) {
				const k = (j + i) % l;
				if(!ridges[k].p1.eq(end) && !ridges[k].$contains(end)) continue;

				// Found matching, perform substitution
				const tail = k < i ? l - i : j + 1, head = j + 1 - tail;
				const pts = detour.concat();
				lines.push(new Line(end, ridges[k].p2));
				if(!eq) {
					pts.unshift(ridges[i].p1);
					lines.unshift(new Line(ridges[i].p1, start));
				}
				contour.splice(i, tail, ...pts);
				ridges.splice(i, tail, ...lines);
				contour.splice(0, head);
				ridges.splice(0, head);
				return;
			}

			// Something is wrong with the given detour if we get here.
			debugger;
		}
	}
}
