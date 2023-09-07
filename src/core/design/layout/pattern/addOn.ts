import { Region } from "./region";
import { cache } from "core/utils/cache";
import { Vector } from "core/math/geometry/vector";
import { Point } from "core/math/geometry/point";
import { toLines } from "core/math/geometry/rationalPath";

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
		const ridges = toLines(contour);
		return { contour, ridges };
	}

	@cache public get $direction(): Vector {
		return new Vector(this.dir).$reduceToInt();
	}
}
