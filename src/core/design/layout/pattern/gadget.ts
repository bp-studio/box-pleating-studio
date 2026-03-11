import { Piece } from "./piece";
import { Point } from "core/math/geometry/point";
import { makePerQuadrant, perQuadrant } from "shared/types/direction";
import { Vector } from "core/math/geometry/vector";
import { Cache } from "core/utils/cache";
import { Fraction } from "core/math/fraction";
import { getIntersection } from "core/math/geometry/line";
import { Overlap } from "core/math/sweepLine/clip/overlap";
import { join, shift, toLines, toPath } from "core/math/geometry/rationalPath";
import { clone } from "shared/utils/clone";

import type { RationalPath } from "core/math/geometry/rationalPath";
import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { JAnchor, JGadget, JOverlap } from "shared/json";
import type { Device } from "./device";

/**
 * The first field is the anchor point itself,
 * ths second field is the index of the {@link Piece} from which it came (if available).
 */
type AnchorMap = [Point, number | null];

//=================================================================
/**
 * {@link Gadget} is a component in a {@link Device} corresponding to a single {@link JOverlap}.
 * It always have four {@link JAnchor}s.
 */
//=================================================================
export class Gadget implements JGadget {

	public pieces: readonly Piece[];
	public offset?: IPoint;
	public anchors?: JAnchor[];

	constructor(data: JGadget) {
		this.pieces = data.pieces.map(p => new Piece(p));
		this.offset = data.offset;
		this.pieces.forEach(p => this.offset && p.$offset(this.offset));
		this.anchors = clone(data.anchors); // Must clone!
	}

	/**
	 * The width span between the two major anchors.
	 * Note that this might be larger than the width of the SCR.
	 * Used for positioning.
	 */
	public readonly widthSpan = new Cache(() =>
		Math.ceil(this.$anchorMap.value[2][0].x) - Math.floor(this.$anchorMap.value[0][0].x)
	);

	/**
	 * The height span between the two major anchors.
	 * Note that this might be larger than the height of the SCR.
	 * Used for positioning.
	 */
	public readonly heightSpan = new Cache(() =>
		Math.ceil(this.$anchorMap.value[2][0].y) - Math.floor(this.$anchorMap.value[0][0].y)
	);

	public readonly $anchorMap = new Cache<PerQuadrant<AnchorMap>>(() =>
		makePerQuadrant<AnchorMap>(q => {
			if(this.anchors?.[q]?.location) {
				let p = new Point(this.anchors[q].location!);
				if(this.offset) p = p.$add(new Vector(this.offset));
				return [p, null];
			} else {
				if(this.pieces.length == 1) return [this.pieces[0].$anchors.value[q]!, 0];
				for(const [i, p] of this.pieces.entries()) {
					if(p.$anchors.value[q]) return [p.$anchors.value[q]!, i];
				}
				/* istanbul ignore next: debug */
				throw new Error(); // Shouldn't enter here in theory
			}
		})
	);

	public readonly $slack = new Cache<PerQuadrant<number>>(() => {
		if(!this.anchors) return perQuadrant([0, 0, 0, 0]);
		return makePerQuadrant(q => this._getSlack(q));
	});

	public readonly $contour = new Cache<RationalPath>(() => {
		const p = this.pieces;
		let contour = p[0].$shape.value.contour;
		for(let i = 1; i < p.length; i++) contour = join(contour, p[i].$shape.value.contour);
		return contour;
	});

	/**
	 * In case of relay, get the remaining x-component.
	 * @param q1 {@link QuadrantDirection} of the corner being connected to, which is either 1 or 3.
	 * @param q2 {@link QuadrantDirection} of the corner by the other {@link Gadget}, which is either 0 or 2.
	 */
	public rx(q1: QuadrantDirection, q2: QuadrantDirection): number {
		return Math.ceil(Math.abs(this.$anchorMap.value[q1][0].x - this.$anchorMap.value[q2][0].x));
	}

	public $reverseGPS(): Gadget {
		const g = new Gadget(this);
		const [p1, p2] = g.pieces;
		const sx = Math.ceil(Math.max(p1.sx, p2.sx));
		const sy = Math.ceil(Math.max(p1.sy, p2.sy));
		p1.$reverse(sx, sy);
		p2.$reverse(sx, sy);
		return g;
	}

	public $addSlack(q: QuadrantDirection, slack: number): Gadget {
		if(slack != 0) {
			this.anchors = this.anchors || [];
			this.anchors[q] = this.anchors[q] || {};
			this.anchors[q].slack = (this.anchors[q].slack ?? 0) + slack;
		}
		return this;
	}

	/**
	 * Setup the necessary slack towards a connection target.
	 * @param g Connection target
	 * @param q1 From which {@link QuadrantDirection} (0 or 2)
	 * @param q2 To which {@link QuadrantDirection} (1 or 3)
	 */
	public $setupConnectionSlack(g: Gadget, q1: QuadrantDirection, q2: QuadrantDirection): void {
		const c2 = g.$contour.value;
		const f = q1 == 0 ? 1 : -1;
		const step = new Vector(f, f);
		const slack = new Fraction(this._getSlack(q1));
		const v = g.$anchorMap.value[q2][0].$sub(Point.ZERO).$add(step.$scale(slack));

		const c0_shift = q1 == 0 ? v : v.$add(Point.ZERO.$sub(this.$anchorMap.value[2][0]));
		const c0 = shift(this.$contour.value, c0_shift); // We keep this for debugging
		let c1 = c0;

		// Perform collision tests.
		// Be careful! We must ensure that the contours are simple here!
		let s = 0;
		const path2 = toPath(c2);
		while(Overlap.$test(toPath(c1), path2)) {
			c1 = shift(c1, step);
			s++;

			/// #if DEBUG
			/* istanbul ignore next: debug */
			if(s == OVERLAP_LIMIT) {
				// If we get here, typically it means one of the contours is not simple.
				// Goto joinLogic.ts to debug the issue.
				console.log(this.$contour.value.map(p => p.toString()));
				console.log(c2.map(p => p.toString()));
				const c = this.$contour.value;
				console.log(JSON.stringify([[c.map(p => p.$toIPoint()), c2.map(p => p.$toIPoint())]]));
				debugger;
				throw new Error("Contour error");
			}
			/// #endif
		}
		this.$addSlack(q1, s);
	}

	/** If the current {@link Gadget} contains the given ray. */
	public $intersects(p: Point, v: Vector): boolean {
		const lines = toLines(this.$contour.value);
		for(const line of lines) {
			const intersection = getIntersection(line, p, v, true);
			if(intersection && !intersection.point.eq(p)) return true;
		}
		return false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _getSlack(q: QuadrantDirection): number {
		return this.anchors?.[q]?.slack ?? 0;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Static methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Simplify JSON data representation, for creating signature. */
	public static $simplify(g: JGadget): JGadget {
		/* istanbul ignore next: foolproof */
		if(g.offset && g.offset.x == 0 && g.offset.y == 0) delete g.offset;
		delete g.anchors; // anchor info is irrelevant to signature
		return g;
	}
}

/// #if DEBUG
const OVERLAP_LIMIT = 1000;
/// #endif
