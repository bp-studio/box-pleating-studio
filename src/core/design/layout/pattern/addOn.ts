import { Region } from "./region";
import { cache } from "core/utils/cache";
import { Vector } from "core/math/geometry/vector";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";

import type { IRegionShape } from "./region";
import type { JAddOn } from "shared/json";
import type { Device } from "./device";
import type { Gadget } from "./gadget";

//=================================================================
/**
 * {@link AddOn} is a {@link Region} in a {@link Device} that does not belong to any {@link Gadget},
 * which is produced by standard joins.
 */
//=================================================================
export class AddOn extends Region implements JAddOn {
	public readonly contour: IPoint[];
	public readonly dir: IPoint;

	constructor(data: JAddOn) {
		super();
		this.contour = data.contour;
		this.dir = data.dir;
	}

	@cache public get $shape(): IRegionShape {
		const contour = this.contour.map(p => new Point(p));
		const ridges = contour.map((p, i, c) => new Line(p, c[(i + 1) % c.length]));
		return { contour, ridges };
	}

	@cache public get $direction(): Vector {
		return new Vector(this.dir).$reduceToInt();
	}
}
