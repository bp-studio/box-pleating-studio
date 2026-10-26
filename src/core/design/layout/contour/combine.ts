import { Line } from "core/math/geometry/line";
import { toPath, toRationalPath } from "core/math/geometry/rationalPath";
import { deduplicate, isClockwise } from "core/math/geometry/path";
import { GeneralUnion } from "core/math/sweepLine/polyBool/generalUnion/generalUnion";
import { Stacking } from "core/math/sweepLine/stacking/stacking";
import { fixPath } from "core/math/geometry/float";
import { debugAssert } from "core/utils/debug";
import { regularize, removeSolidComponents } from "./regularization";

import type { RationalPath, RationalPathEx } from "core/math/geometry/rationalPath";
import type { Point } from "core/math/geometry/point";
import type { Contour, PathEx, Polygon } from "shared/types/geometry";
import type { ContourComponent, ITreeNode, PatternContour, TraceContour } from "../../context";

/**
 * {@link TraceContour} represented in {@link RationalPath}s.
 */
export type RationalContour = ContourComponent<RationalPathEx>;

const generalUnion = new GeneralUnion();

export function combineContour(node: ITreeNode): void {
	const g = node.$graphics;
	const childrenPatternContours = new Map<ITreeNode, PatternContour[]>();

	for(const child of node.$children) {
		// There's no need to process a child pattern contour if the
		// corresponding pattern does not involve the current node
		const contours = child.$graphics.$patternContours.filter(p => {
			if(!p.$ids.includes(node.id)) return false;
			return true;
		});
		childrenPatternContours.set(child, contours);
	}
	const result: RationalContour[] = g.$traceContours.map(toRationalContour);

	// To temporarily disable pattern contour, comment the following lines.
	insertOuter(g.$patternContours, result);
	const all = [...childrenPatternContours.values()].flatMap(c => c);
	const failed = insertInner(all, result);
	for(const contour of failed) {
		rebuildInner(contour, childrenPatternContours);
	}
	g.$orphans = [];
	regularize(node, result);

	g.$contours = result.flatMap(toGraphicalContours);
	removeSolidComponents(node);
}

function insertOuter(
	patternContours: PatternContour[], result: RationalContour[]
): void {
	for(const contour of patternContours) {
		if(contour.$for !== undefined) {
			// If we know the pairing, we can process directly
			tryInsertOuter(contour, result[contour.$for]);
		} else {
			// Otherwise fallback to trying each rough contour
			for(const rough of result) {
				/* istanbul ignore else: foolproof */
				if(tryInsertOuter(contour, rough)) break;
			}
		}
	}
}

function tryInsertOuter(
	patternContour: PatternContour, rough: RationalContour
): boolean {
	const piece = patternContour.$piece;
	if(piece !== undefined) {
		return tryInsert(rough.$outer[piece], patternContour);
	}
	for(const outer of rough.$outer) {
		if(tryInsert(outer, patternContour)) return true;
	}
	/* istanbul ignore next: foolproof */
	return false;
}

/**
 * Insert the pattern contours of the children into the inner paths,
 * and returns the {@link RationalContour}s for which some insertion failed.
 */
function insertInner(
	childrenPatternContours: PatternContour[], result: RationalContour[]
): Set<RationalContour> {
	const failed = new Set<RationalContour>();
	for(const childContour of childrenPatternContours) {
		const target = tryInsertInner(childContour, result);
		if(target) failed.add(target);
	}
	return failed;
}

/**
 * Returns the {@link RationalContour} that should have received the insertion
 * if it failed, or `undefined` otherwise.
 */
function tryInsertInner(
	childContour: PatternContour, result: RationalContour[]
): RationalContour | undefined {
	let target: RationalContour | undefined;
	for(const contour of result) {
		for(const inner of contour.$inner) {
			const leaves = inner.leaves || contour.$leaves;
			if(childContour.$leaves.some(l => !leaves.includes(l))) continue;
			if(tryInsert(inner, childContour)) return undefined;
			target ??= contour;
		}
	}
	return target;
}

/**
 * Rebuild the inner paths as the union of the final outer paths of the
 * children.
 *
 * Normally the inner paths are made from the outer paths of the children, and
 * the pattern contours of the children are inserted into them. But if the
 * children overlap (in invalid layouts), the inner paths are their union, and
 * the ends of a pattern contour could lie inside the union, so that it cannot
 * be inserted. In that case, the region cut off by the pattern contour from
 * the child would be left uncovered, so we take the union of the children
 * with their pattern contours inserted instead.
 */
function rebuildInner(
	contour: RationalContour,
	childrenPatternContours: ReadonlyMap<ITreeNode, PatternContour[]>
): void {
	const polygons: Polygon[] = [];
	for(const [child, patternContours] of childrenPatternContours) {
		const childResult =
			child.$graphics.$traceContours.map(toRationalContour);
		insertOuter(patternContours, childResult);
		for(const c of childResult) {
			if(!c.$leaves.some(l => contour.$leaves.includes(l))) continue;
			polygons.push(c.$outer.map(toPath).map(orientByRole));
		}
	}
	contour.$inner = generalUnion.$get(...polygons).map(toRationalPath);
}

/** Orient a path so that the filled region is on its left. */
function orientByRole(path: PathEx): PathEx {
	if(isClockwise(path) == Boolean(path.isHole)) return path;
	const result: PathEx = path.toReversed();
	result.isHole = path.isHole;
	return result;
}

/**
 * Replace the part of the path between the two ends of the inserted path
 * (which should lie on the path).
 * Returns `false` if the ends are not found on the path.
 *
 * Normally the inserted path goes along the direction of the path, but it is
 * possible that it goes the other way around (for example, when it cuts across
 * a narrow slot of the path in invalid layouts), in which case the replaced
 * part would be the long way around the path. So we also try the reversed one,
 * and take the result that changes the area the least, since the inserted path
 * only modifies the path locally.
 *
 * Note that when the inserted path cuts across a slot, neither result is
 * actually correct: one replaces the long way around the path, and the other
 * fills (part of) the slot. We take the latter as a compromise, but then the
 * final contours could cover some region outside the union of the rough
 * contours, which would be inconsistent with the uncovered regions found by
 * the health check (see findUncoveredRegions). As far as we know, this only
 * happens in layouts with invalid junctions, which are reported anyway. To fix
 * this, we would need to reject the insertion if the added region is not
 * covered by the union of the rough contours, which requires global
 * information that is not available here.
 */
export function tryInsert(path: RationalPath, insert: RationalPath): boolean {
	// An inserted path lying entirely on the path changes nothing. Note that
	// we cannot rely on the replacement below in this case, as both ends could
	// lie on the same edge, and it could replace the long way around.
	if(isAlongPath(path, insert)) return true;
	let result = replace(path, insert);
	if(!result) return false;
	const backward = replace(path, insert.toReversed());
	if(backward) {
		const area = signedArea(path);
		const df = Math.abs(signedArea(result) - area);
		const db = Math.abs(signedArea(backward) - area);
		if(db < df) result = backward;
	}
	path.splice(0, path.length, ...result);
	return true;
}

/**
 * Returns a new path with the part between the two ends of the inserted path
 * replaced, or `null` if the ends are not found on the path.
 */
function replace(path: RationalPath, insert: RationalPath): Point[] | null {
	const l = path.length;
	const first = insert[0];
	const last = insert[insert.length - 1];
	let start: number | undefined, end: number | undefined;
	for(let i = 0; i < l; i++) {
		const line = new Line(path[i], path[i + 1] || path[0]);
		if(
			start === undefined &&
			(line.$contains(first) || line.p1.eq(first))
		) {
			start = i + 1;
		}
		if(end === undefined && (line.$contains(last) || line.p2.eq(last))) {
			end = i + 1;
		}
		if(start !== undefined && end !== undefined && start != end) {
			if(end > start) {
				return [...path.slice(0, start), ...insert, ...path.slice(end)];
			} else {
				return [...path.slice(end, start), ...insert];
			}
		}
	}
	return null;
}

/** Whether every segment of the inserted path lies on the path. */
function isAlongPath(path: RationalPath, insert: RationalPath): boolean {
	const lines = path.map((p, i) => new Line(p, path[i + 1] || path[0]));
	for(let i = 0; i + 1 < insert.length; i++) {
		const [a, b] = [insert[i], insert[i + 1]];
		if(!lines.some(l => l.$contains(a, true) && l.$contains(b, true))) {
			return false;
		}
	}
	return true;
}

function signedArea(path: RationalPath): number {
	const l = path.length;
	let result = 0;
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const p = path[i].$toIPoint(), q = path[j].$toIPoint();
		result += (q.x - p.x) * (q.y + p.y);
	}
	return result / 2;
}

function toRationalContour(contour: TraceContour): RationalContour {
	return {
		$outer: contour.$outer.map(toRationalPath),
		$inner: contour.$inner.map(toRationalPath),
		$leaves: contour.$leaves,
		$raw: contour.$raw,
	};
}

/**
 * Convert {@link RationalContour} to the actual {@link Contour} for rendering.
 */
export function toGraphicalContours(contour: RationalContour): Contour[] {
	let outers = contour.$outer.map(toPath).map(simplify);
	let inners = contour.$inner.map(toPath).map(simplify).map(reverse);

	debugAssert(
		() => !inners.some(p => p.length == 2), "Degenerated inner path"
	);

	// The filled inner paths are the holes enclosed by the children,
	// which are filled by the current node.
	const innerFill = inners.filter(p => !p.isHole);
	rearrangeRole(outers, inners);
	if(contour.$raw) {
		// The filled inner paths must not be merged into the outer paths,
		// otherwise they would be absorbed and then excluded by the union of
		// the inner paths.
		outers = generalUnion.$get(outers.filter(p => !innerFill.includes(p)));
		inners = generalUnion.$get(inners.map(reverse)).map(reverse);
		rearrangeRole(outers, inners);
		outers.push(...innerFill);
	}
	outers = cleanUp(outers);
	inners = cleanUp(inners);

	// Trivial case
	if(outers.length == 1) {
		return [{
			outer: outers[0],
			inner: inners,
		}];
	}

	// General case
	return stacking.$get(...outers, ...inners);
}

function cleanUp(paths: PathEx[]): PathEx[] {
	// GeneralUnion can sometimes generate contours with floating errors,
	// and we need to fix those to make river ridges work properly.
	return paths.map(simplify).filter(c => c.length > 2).map(fixPath);
}

function rearrangeRole(outers: PathEx[], inners: PathEx[]): void {
	const outerHole = outers.filter(p => p.isHole);
	const innerFill = inners.filter(p => !p.isHole);
	const outerFill = outers.filter(p => !p.isHole);
	const innerHole = inners.filter(p => p.isHole);
	outers.length = 0;
	inners.length = 0;
	outers.push(...innerFill, ...outerFill);
	inners.push(...outerHole, ...innerHole);
}

function simplify(path: PathEx): PathEx {
	const deduplicated = deduplicate(path);
	const l = deduplicated.length;
	deduplicated.push(deduplicated[0]);
	const result: PathEx = [];
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const prev = deduplicated[j];
		const p = deduplicated[i];
		const next = deduplicated[i + 1];
		const isCorner = (prev.x != p.x || next.x != p.x) &&
			(prev.y != p.y || next.y != p.y);
		if(isCorner) result.push(p);
	}
	result.isHole = path.isHole;
	return result;
}

function reverse(path: PathEx): PathEx {
	const result: PathEx = path.toReversed();
	result.isHole = !path.isHole;
	return result;
}

const stacking = new Stacking();
