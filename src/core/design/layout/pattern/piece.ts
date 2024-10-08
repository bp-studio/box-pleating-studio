import { Region } from "./region";
import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";
import { Line } from "core/math/geometry/line";
import { cache, clearCache } from "core/utils/cache";
import { toLines } from "core/math/geometry/rationalPath";
import { deduplicate } from "core/math/geometry/path";
import { norm, same } from "shared/types/geometry";
import { reduce } from "core/math/utils/gcd";
import { perQuadrant } from "shared/types/direction";

import type { PerQuadrant } from "shared/types/direction";
import type { Path } from "shared/types/geometry";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Gadget } from "./gadget";
import type { IRegionShape } from "./region";
import type { JPiece } from "shared/json";

/**
 * Originally this is defined as a non-enumerable field on {@link Piece},
 * but for some reason ts-node have problem with the non-enumerable decorator,
 * so we use a {@link WeakMap} to store this info instead.
 */
const offsets = new WeakMap<Piece, IPoint>();

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

	public detours?: Path[];

	public shift?: IPoint;

	constructor(data: JPiece) {
		super();
		this.ox = data.ox;
		this.oy = data.oy;
		this.u = data.u;
		this.v = data.v;
		this.detours = data.detours;
		this.shift = data.shift;
		offsets.set(this, { x: 0, y: 0 });
	}

	public $offset(o: IPoint): void {
		const offset = offsets.get(this)!;
		/* istanbul ignore next: foolproof */
		if(same(offset, o)) return;
		offsets.set(this, o);
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
		this.shift = s;
		this.detours = detours?.map(c =>
			c.map(p => ({ x: sx - p.x, y: sy - p.y }))
		);
	}

	/** Shrink a {@link Piece} proportionally. This will reset the cache. */
	public $shrink(by: number): this {
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
	 * Its coordinates should not incorporate the offset.
	 */
	public $addDetour(detour: Path): void {
		// Precondition check
		detour = deduplicate(detour);
		/* istanbul ignore next: foolproof */
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

	/** Calculate the angle bisector of the directional vectors of two pieces. */
	public $bisector(that: Piece): Vector {
		const v1 = this.$direction;
		const v2 = that.$direction;
		const [x1, y1] = reduce(v1._x, v1._y);
		const [x2, y2] = reduce(v2._x, v2._y);
		// In this use case, z1 and z2 are guaranteed to be integers
		const z1 = norm(x1, y1);
		const z2 = norm(x2, y2);
		return new Vector(x1 * z2 + x2 * z1, y1 * z2 + y2 * z1);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@cache public get $anchors(): PerQuadrant<Point | null> {
		const p = this._points;
		const { contour } = this.$shape;
		// Anchor 0 and 2 must exist for any piece
		return perQuadrant([
			p[0],
			getIdentical(contour, p[1]),
			p[2],
			getIdentical(contour, p[3]),
		]);
	}

	@cache public get $direction(): Vector {
		const { oy, v } = this;
		return new Vector(oy + v, v).$doubleAngle().$reduceToInt();
	}

	@cache public get $shape(): IRegionShape {
		const contour = this._points.concat();
		const ridges = toLines(contour);
		if(this.detours) {
			for(const detour of this.detours) {
				this._processDetour(ridges, contour, detour);
			}
		}
		return { contour, ridges };
	}

	/**
	 * Return the original contour (not including shifting and detour)
	 * of this piece. Used only for constructing standard join.
	 */
	public get $originalContour(): readonly Point[] {
		const unshift = this._shift.$neg; // v0.6.17: This is needed
		return this._points.map(p => p.$add(unshift));
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
		return result.map(p => p.$add(this._shift));
	}

	@cache private get _shift(): Vector {
		const offset = offsets.get(this)!;
		return new Vector(
			(this.shift?.x ?? 0) + offset.x,
			(this.shift?.y ?? 0) + offset.y
		);
	}

	private _processDetour(ridges: Line[], contour: RationalPath, _detour: Path): void {
		const detour = _detour.map(p => new Point(p).$add(this._shift));
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
			/* istanbul ignore next: debug */
			debugger;
		}
	}
}

function getIdentical(contour: RationalPath, p: Point): Point | null {
	return contour.includes(p) ? p : null;
}
