import { clone } from "shared/utils/clone";
import { Region } from "./region";
import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";
import { Line } from "core/math/geometry/line";
import { cache } from "core/utils/cache";

import type { Gadget } from "./gadget";
import type { IRegionShape } from "./region";
import type { JPiece } from "shared/json";

//=================================================================
/**
 * {@link Piece} is a {@link Region} in a {@link Gadget}.
 */
//=================================================================
export class Piece extends Region implements JPiece, ISerializable<JPiece> {

	public ox: number;

	public oy: number;

	public u: number;

	public v: number;

	public detours?: IPoint[][];

	public shift?: IPoint;

	constructor(data: JPiece) {
		super();
		this.ox = data.ox;
		this.oy = data.oy;
		this.u = data.u;
		this.v = data.v;
		this.detours = data.detours;
		this.shift = data.shift;
	}

	public toJSON(): JPiece {
		return clone<JPiece>(this);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $anchors(): (Point | null)[] {
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
		const ridges = contour.map((p, i, c) => new Line(p, c[(i + 1) % c.length]));
		// (this.detours || []).forEach(d => this._processDetour(ridges, contour, d));
		return { contour, ridges };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private get _points(): Point[] {
		const { ox, oy, u, v } = this;

		// a GOPS is like the reverse of the Overlap region,
		// therefore the corners are arranged in clockwise direction, starting from the lower left.
		const result = [
			Point.ZERO,
			new Point(u, ox + u),
			new Point(oy + u + v, ox + u + v),
			new Point(oy + v, v),
		];
		//result.forEach(p => p.addBy(this._shift));
		return result;
	}
}
