import { Fraction } from "core/math/fraction";
import { Line } from "core/math/geometry/line";

import type { Point } from "core/math/geometry/point";
import type { Vector } from "core/math/geometry/vector";

export interface IRegionShape {

	/** The contour of the region. */
	contour: Point[];

	/**
	 * The edges on the contour.
	 * The i-th edge goes from the i-th point to the (i+1)-th point.
	 */
	ridges: Line[];
}

//=================================================================
/**
 * {@link Region} is a single axis-parallel region.
 */
//=================================================================

export abstract class Region {

	public abstract get $shape(): IRegionShape;

	/** The direction {@link Vector} of axis-parallel creases. */
	public abstract get $direction(): Vector;

	public get $axisParallels(): readonly Line[] {
		const ref = this.$shape.contour.find(p => p.$isIntegral)!;

		// find the range of axis-parallel creases
		const dir = this.$direction;
		const step = dir.$rotate90().$normalize();
		let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
		for(const p of this.$shape.contour) {
			const units = p.sub(ref).dot(step);
			if(units > max) max = units;
			if(units < min) min = units;
		}

		// Calculate all creases
		const ap: Line[] = [];
		for(let i = Math.ceil(min); i <= Math.floor(max); i++) {
			const p = ref.add(step.$scale(new Fraction(i)));
			const intersections: Point[] = [];

			// TODO: improve this part
			for(const r of this.$shape.ridges) {
				const j = r.$intersection(p, dir);
				if(j && !j.eq(intersections[0])) intersections.push(j);
				if(intersections.length == 2) break;
			}

			// An axis parallel crease would not intersect a region more than twice.
			if(intersections.length == 2) {
				ap.push(new Line(...intersections as [Point, Point]));
			}
		}
		return ap;
	}
}
