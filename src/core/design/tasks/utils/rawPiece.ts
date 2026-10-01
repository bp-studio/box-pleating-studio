import { AAUnion } from "core/math/sweepLine/polyBool";
import { State } from "core/service/state";
import { getQuadrant, makePerQuadrant } from "shared/types/direction";
import { getFactors } from "../../layout/pattern/quadrant";
import { carveCorners } from "./carve";
import { simplify } from "./expand";
import { tryInsert } from "./combine";
import { Line } from "core/math/geometry/line";
import { toRationalPath } from "core/math/geometry/rationalPath";

import type { IRect } from "./carve";
import type { Path, PathEx } from "shared/types/geometry";
import type { Point } from "core/math/geometry/point";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { ValidJunction } from "../../layout/junction/validJunction";
import type { ITreeNode, PatternContour } from "../../context";

const aaUnion = new AAUnion();

/**
 * The carving of a leaf in a raw piece (see {@link traceContourTask}).
 *
 * The raw piece of a leaf is its hinge rectangle expanded to the node,
 * with the overlapping regions of some of its junctions carved out of the corners.
 */
export interface Carving {
	/** The hinge rectangle of the leaf expanded to the node. */
	readonly rect: IRect;

	/**
	 * The corners carved out of the piece in any case,
	 * namely the invasions from the flaps outside the node and the covered junctions.
	 */
	readonly always: IRect[];

	/**
	 * The corners of the digested junctions (i.e. with the flaps also inside the node), by the quadrant of the leaf.
	 * These are carved out only when tracing the corresponding quadrant (see {@link getQuadrantShape}).
	 */
	readonly digested: PerQuadrant<IRect[]>;
}

/** A path of a raw piece, along with the {@link Carving}s of the leaves forming it. */
export interface RawPiece extends PathEx {
	carvings?: Carving[];
}

/**
 * Create the raw pieces of a single leaf under the node.
 * @param covered The covered junctions of the leaf (by the junctions of other flaps).
 */
export function createRawPieces(node: ITreeNode, leaf: ITreeNode, covered: readonly ValidJunction[]): RawPiece[] {
	const carving = createCarving(node, leaf, new Set(covered));
	const paths: RawPiece[] = carveCorners(carving.rect, carving.always);
	for(const path of paths) path.carvings = [carving];
	return paths;
}

/**
 * The shape of the raw piece for tracing the given quadrant, that is,
 * with the overlapping regions of the digested junctions in that quadrant carved out as well.
 * For a piece formed by multiple leaves, each leaf is carved first, and then we take the union.
 * Returns `null` if there is no such junctions (so that the base shape applies).
 */
export function getQuadrantShape(piece: RawPiece, q: QuadrantDirection): PathEx[] | null {
	const carvings = piece.carvings;
	if(!carvings || carvings.every(c => !c.digested[q].length)) return null;
	const shapes = carvings.flatMap(c => carveCorners(c.rect, c.always.concat(c.digested[q])));
	const result = shapes.length > 1 ? aaUnion.$get(...shapes.map(p => [p])) : shapes;
	return result.map(simplify);
}

/**
 * Convert a {@link PatternContour} traced on the shape of the given quadrant (see {@link getQuadrantShape})
 * into one that can be inserted into the base shape of the piece.
 *
 * We insert the contour into the quadrant shape, and then extend both ends of the contour
 * along the result until they reach the base shape (that is, including the carved parts that remain).
 * Returns `null` if that fails.
 */
export function extendToBase(base: Path, shape: Path, contour: PatternContour): PatternContour | null {
	const patched = toRationalPath(shape);
	if(!tryInsert(patched, contour)) return null;
	const n = patched.length;
	const start = patched.findIndex(p => p.eq(contour[0]));
	/* istanbul ignore next: foolproof */
	if(start < 0) return null;

	const basePath = toRationalPath(base);
	const baseLines = basePath.map((p, i) => new Line(p, basePath[i + 1] || basePath[0]));
	const onBase = (p: Point): boolean => baseLines.some(l => l.$contains(p, true));

	const result: RationalPath = contour.concat();
	for(let i = start, k = 0; !onBase(result[0]) && k < n; k++) {
		i = (i - 1 + n) % n;
		result.unshift(patched[i]);
	}
	for(let i = (start + contour.length - 1) % n, k = 0; !onBase(result[result.length - 1]) && k < n; k++) {
		i = (i + 1) % n;
		result.push(patched[i]);
	}
	return result as PatternContour;
}

function createCarving(node: ITreeNode, leaf: ITreeNode, covered: ReadonlySet<ValidJunction>): Carving {
	const l = leaf.$dist - node.$dist + node.$length;
	const [t, r, b, lf] = leaf.$AABB.$toValues();
	const rect: IRect = { x1: lf - l, y1: b - l, x2: r + l, y2: t + l };
	const inside = new Set(node.$leaves.map(n => n.id));
	const always: IRect[] = [];
	const digested = makePerQuadrant<IRect[]>(() => []);
	for(const junction of State.$junctions.values()) {
		if(!junction.$valid || !junction.$involves(leaf.id)) continue;
		const j = junction as ValidJunction;
		const isCovered = covered.has(j);
		const isDigested = inside.has((j.$a === leaf ? j.$b : j.$a).id);
		if(!isCovered && !isDigested && j.$invasion?.flap !== leaf) continue;

		const q = getQuadrant(j.$a === leaf ? j.$q1 : j.$q2);
		const corner = cornerRect(rect, q, j.$o.x, j.$o.y);
		if(isDigested && !isCovered) digested[q].push(corner);
		else always.push(corner);
	}
	return { rect, always, digested };
}

/** The rectangle of the given size at the given corner of the rectangle (clipped by it). */
function cornerRect(rect: IRect, q: QuadrantDirection, x: number, y: number): IRect {
	const f = getFactors(q);
	const cx = f.x > 0 ? rect.x2 : rect.x1;
	const cy = f.y > 0 ? rect.y2 : rect.y1;
	const ix = cx - f.x * x;
	const iy = cy - f.y * y;
	return {
		x1: Math.max(rect.x1, Math.min(cx, ix)), y1: Math.max(rect.y1, Math.min(cy, iy)),
		x2: Math.min(rect.x2, Math.max(cx, ix)), y2: Math.min(rect.y2, Math.max(cy, iy)),
	};
}
