import { State } from "core/service/state";
import { getQuadrant, makePerQuadrant } from "shared/types/direction";
import { carveCorners, cornerRect } from "./carve";
import { getFactors } from "../../layout/pattern/quadrant";
import { fitsAt } from "./invasion";
import { simplify } from "./expand";
import { tryInsert } from "./combine";
import { Line } from "core/math/geometry/line";
import { toRationalPath } from "core/math/geometry/rationalPath";
import { AAUnion } from "core/math/sweepLine/polyBool";

import type { IRect } from "./carve";
import type { Path, PathEx } from "shared/types/geometry";
import type { Point } from "core/math/geometry/point";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { PerQuadrant, QuadrantCode, QuadrantDirection } from "shared/types/direction";
import type { ValidJunction } from "../../layout/junction/validJunction";
import type { ITreeNode, PatternContour } from "../../context";

const aaUnion = new AAUnion();

/**
 * The carving of a leaf in a raw piece (see {@link traceContourTask}).
 *
 * The raw piece of a leaf is its hinge rectangle expanded to the node, with
 * the overlapping regions of some of its junctions carved out of the corners.
 */
export interface Carving {
	/**
	 * The hinge rectangle of the leaf expanded to the node (or a part of it,
	 * see {@link createQuadrantPieces}).
	 */
	readonly rect: IRect;

	/**
	 * The corners carved out of the piece in any case, namely the invasions
	 * carved at the level of the node and the covered junctions.
	 * Note that an invasion is carved even if the invading flap is also inside
	 * the node, since the part of the overlapping region not covered by that
	 * flap belongs to the outside (see {@link ValidJunction.$invasion}).
	 *
	 * A covered junction has no pattern of its own, and its overlapping region
	 * is distributed by the pattern of the junction covering it, which could
	 * give the region to the other side. So the piece must give up the region,
	 * or it sticks out of the pattern contour of the covering junction, leaving
	 * a staircase corner that no pattern fixes (as in the sample
	 * `v08.riverRidge`, where the junction of flaps 9 and 19 is covered by that
	 * of flaps 12 and 19, and flap 12 is inside the node). But that applies
	 * only if the pattern involves the river of the node (see
	 * {@link createCarving}).
	 */
	readonly always: IRect[];

	/** Same as {@link always}, by the quadrant of the leaf. */
	readonly alwaysByQuadrant: PerQuadrant<IRect[]>;

	/**
	 * The corners of the other digested junctions (i.e. with the flaps also
	 * inside the node), by the quadrant of the leaf. These are carved out only
	 * when tracing the corresponding quadrant (see {@link getQuadrantShape}).
	 */
	readonly digested: PerQuadrant<IRect[]>;
}

/**
 * A path of a raw piece, along with the {@link Carving}s of the leaves
 * forming it.
 */
export interface RawPiece extends PathEx {
	carvings?: Carving[];

	/**
	 * If defined, only these quadrants of the leaves are included in the piece
	 * (see {@link createQuadrantPieces}), and only they are traced on it.
	 */
	quadrants?: ReadonlySet<QuadrantCode>;
}

/**
 * Create the raw pieces of a single leaf under the node.
 * @param covered The covered junctions of the leaf
 * (by the junctions of other flaps).
 */
export function createRawPieces(
	node: ITreeNode, leaf: ITreeNode, covered: readonly ValidJunction[]
): RawPiece[] {
	const carving = createCarving(node, leaf, new Set(covered));
	const paths: RawPiece[] = carveCorners(carving.rect, carving.always);
	for(const path of paths) path.carvings = [carving];
	return paths;
}

/**
 * Create the raw pieces of a part of a single leaf under the node, consisting
 * of the given quadrants only (see {@link createRawContour}).
 *
 * The part of a quadrant is the hinge rectangle of the leaf expanded to the
 * node, restricted to the quadrant together with the rectangle of the leaf
 * itself, so that the parts of the four quadrants overlap exactly on the
 * rectangle of the leaf. Only the corners of the quadrant are carved, as the
 * pattern contours of the quadrant modify the part only.
 */
export function createQuadrantPieces(
	node: ITreeNode, leaf: ITreeNode, covered: readonly ValidJunction[],
	quadrants: readonly QuadrantDirection[]
): RawPiece[] {
	const carving = createCarving(node, leaf, new Set(covered));
	const { rect } = carving;
	const [t, r, b, l] = leaf.$AABB.$toValues();
	const result: RawPiece[] = [];
	for(const q of quadrants) {
		const f = getFactors(q);
		const part: IRect = {
			x1: f.x > 0 ? l : rect.x1, x2: f.x > 0 ? rect.x2 : r,
			y1: f.y > 0 ? b : rect.y1, y2: f.y > 0 ? rect.y2 : t,
		};
		const clip = (corners: readonly IRect[]): IRect[] => corners
			.map(c => clipRect(c, part))
			.filter(c => c.x1 < c.x2 && c.y1 < c.y2);
		const always = clip(carving.alwaysByQuadrant[q]);
		const partCarving: Carving = {
			rect: part,
			always,
			alwaysByQuadrant: makePerQuadrant(p => p == q ? always : []),
			digested: makePerQuadrant(
				p => p == q ? clip(carving.digested[q]) : []
			),
		};
		const paths: RawPiece[] = carveCorners(part, always);
		for(const path of paths) path.carvings = [partCarving];
		result.push(...paths);
	}
	return result;
}

function clipRect(a: IRect, b: IRect): IRect {
	return {
		x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
		x2: Math.min(a.x2, b.x2), y2: Math.min(a.y2, b.y2),
	};
}

/**
 * The shape of the raw piece for tracing the given quadrant, that is, with the
 * overlapping regions of the digested junctions in that quadrant carved out as
 * well. Returns `null` if there is no such junctions (so that the base shape
 * applies).
 *
 * A piece formed by multiple leaves (or parts of them, see
 * {@link createQuadrantPieces}) has multiple carvings, and the shape is the
 * union of the carved rectangles.
 */
export function getQuadrantShape(
	piece: RawPiece, q: QuadrantDirection
): PathEx[] | null {
	const carvings = piece.carvings;
	if(!carvings || carvings.every(c => !c.digested[q].length)) return null;
	const shapes = carvings.map(
		c => carveCorners(c.rect, c.always.concat(c.digested[q]))
	);
	const paths = shapes.length > 1 ? aaUnion.$get(...shapes) : shapes[0];
	return paths.map(simplify);
}

/**
 * Convert a {@link PatternContour} traced on the shape of the given quadrant
 * (see {@link getQuadrantShape}) into one that can be inserted into the base
 * shape of the piece.
 *
 * We insert the contour into the quadrant shape, and then extend both ends of
 * the contour along the result until they reach the base shape (that is,
 * including the carved parts that remain). Returns `null` if that fails.
 */
export function extendToBase(
	base: Path, shape: Path, contour: PatternContour
): PatternContour | null {
	const patched = toRationalPath(shape);
	/* istanbul ignore next: foolproof */
	if(!tryInsert(patched, contour)) return null;
	const n = patched.length;
	const start = patched.findIndex(p => p.eq(contour[0]));
	/* istanbul ignore next: foolproof */
	if(start < 0) return null;

	const basePath = toRationalPath(base);
	const baseLines = basePath.map(
		(p, i) => new Line(p, basePath[i + 1] || basePath[0])
	);
	const onBase = (p: Point): boolean =>
		baseLines.some(l => l.$contains(p, true));

	const result: RationalPath = contour.concat();
	for(let i = start, k = 0; !onBase(result[0]) && k < n; k++) {
		i = (i - 1 + n) % n;
		result.unshift(patched[i]);
	}
	const end = (start + contour.length - 1) % n;
	for(let i = end, k = 0; !onBase(result[result.length - 1]) && k < n; k++) {
		i = (i + 1) % n;
		result.push(patched[i]);
	}
	return result as PatternContour;
}

function createCarving(
	node: ITreeNode, leaf: ITreeNode, covered: ReadonlySet<ValidJunction>
): Carving {
	const l = leaf.$dist - node.$dist + node.$length;
	const [t, r, b, lf] = leaf.$AABB.$toValues();
	const rect: IRect = { x1: lf - l, y1: b - l, x2: r + l, y2: t + l };
	const inside = new Set(node.$leaves.map(n => n.id));
	const always: IRect[] = [];
	const alwaysByQuadrant = makePerQuadrant<IRect[]>(() => []);
	const digested = makePerQuadrant<IRect[]>(() => []);
	for(const junction of State.$junctions.values()) {
		if(!junction.$valid || !junction.$involves(leaf.id)) continue;
		const j = junction as ValidJunction;
		const isCovered = covered.has(j);
		const isDigested = inside.has((j.$a === leaf ? j.$b : j.$a).id);
		const invasion = j.$invasion;
		const isInvaded = invasion?.flap === leaf && fitsAt(invasion, l);
		if(!isCovered && !isDigested && !isInvaded) continue;

		if(isCovered && !isDigested && !isInvaded) {
			// The region is given up only to the patterns of the covering
			// junctions, which redistribute the regions of the rivers along
			// the paths between their flaps. So if none of them has a flap
			// inside the node, the river of the node is not involved, and the
			// region stays.
			const involved = j.$getCovering().some(c =>
				inside.has(c.$a.id) || inside.has(c.$b.id)
			);
			if(!involved) continue;
		}

		const q = getQuadrant(j.$a === leaf ? j.$q1 : j.$q2);
		const corner = cornerRect(rect, q, j.$o.x, j.$o.y);
		if(isDigested && !isCovered && !isInvaded) {
			digested[q].push(corner);
		} else {
			always.push(corner);
			alwaysByQuadrant[q].push(corner);
		}
	}
	return { rect, always, alwaysByQuadrant, digested };
}
