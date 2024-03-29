import { Line } from "core/math/geometry/line";
import { toPath, toRationalPath } from "core/math/geometry/rationalPath";
import { deduplicate } from "core/math/geometry/path";
import { GeneralUnion } from "core/math/sweepLine/polyBool/generalUnion/generalUnion";
import { Stacking } from "core/math/sweepLine/stacking/stacking";
import { fixPath } from "core/math/geometry/float";

import type { RationalPath, RationalPathEx } from "core/math/geometry/rationalPath";
import type { Contour, PathEx } from "shared/types/geometry";
import type { ContourComponent, ITreeNode, PatternContour, TraceContour } from "../../context";

/**
 * {@link TraceContour} represented in {@link RationalPath}s.
 */
export type RationalContour = ContourComponent<RationalPathEx>;

const generalUnion = new GeneralUnion();

export function combineContour(node: ITreeNode): void {
	const g = node.$graphics;
	const childrenPatternContours: PatternContour[] = [];

	for(const child of node.$children) {
		// There's no need to process a child pattern contour if the
		// corresponding pattern does not involve the current node
		const contours = child.$graphics.$patternContours.filter(p => {
			if(!p.$ids.includes(node.id)) return false;
			return true;
		});
		childrenPatternContours.push(...contours);
	}
	const result: RationalContour[] = g.$traceContours.map(toRationalContour);

	// To temporarily disable pattern contour, comment the following two lines.
	insertOuter(g.$patternContours, result);
	insertInner(childrenPatternContours, result);

	g.$contours = result.flatMap(toGraphicalContours);
}

function insertOuter(patternContours: PatternContour[], result: RationalContour[]): void {
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

function tryInsertOuter(patternContour: PatternContour, rough: RationalContour): boolean {
	for(const outer of rough.$outer) {
		if(tryInsert(outer, patternContour)) return true;
	}
	/* istanbul ignore next: foolproof */
	return false;
}

function insertInner(childrenPatternContours: PatternContour[], result: RationalContour[]): void {
	for(const childContour of childrenPatternContours) {
		tryInsertInner(childContour, result);
	}
}

function tryInsertInner(childContour: PatternContour, result: RationalContour[]): void {
	for(const contour of result) {
		for(const inner of contour.$inner) {
			const leaves = inner.leaves || contour.$leaves;
			if(childContour.$leaves.some(l => !leaves.includes(l))) continue;
			/* istanbul ignore else: foolproof */
			if(tryInsert(inner, childContour)) return;
		}
	}
}

function tryInsert(path: RationalPath, insert: PatternContour): boolean {
	const l = path.length;
	const first = insert[0];
	const last = insert[insert.length - 1];
	let start: number | undefined, end: number | undefined;
	for(let i = 0; i < l; i++) {
		const line = new Line(path[i], path[i + 1] || path[0]);
		if(start === undefined && (line.$contains(first) || line.p1.eq(first))) {
			start = i + 1;
		}
		if(end === undefined && (line.$contains(last) || line.p2.eq(last))) {
			end = i + 1;
		}
		if(start !== undefined && end !== undefined && start != end) {
			if(end > start) {
				path.splice(start, end - start, ...insert);
			} else {
				path.splice(start);
				path.splice(0, end);
				path.push(...insert);
			}
			return true;
		}
	}
	return false;
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

	// TODO: is this still possible?
	/* istanbul ignore next: debug */
	if(inners.some(p => p.length == 2)) debugger;

	rearrangeRole(outers, inners);
	if(contour.$raw) {
		outers = generalUnion.$get(outers);
		inners = generalUnion.$get(inners.map(reverse)).map(reverse);
		rearrangeRole(outers, inners);
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
		if((prev.x != p.x || next.x != p.x) && (prev.y != p.y || next.y != p.y)) result.push(p);
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
