import { Line } from "core/math/geometry/line";
import { toPath, toRationalPath } from "core/math/geometry/rationalPath";
import { deduplicate, isClockwise } from "core/math/geometry/path";
import { GeneralUnion } from "core/math/sweepLine/polyBool/generalUnion/generalUnion";
import { fixPath } from "core/math/geometry/float";
import { Stacking } from "core/math/sweepLine/stacking/stacking";

import type { RationalPath, RationalPathEx } from "core/math/geometry/rationalPath";
import type { Contour, PathEx } from "shared/types/geometry";
import type { ITreeNode, PatternContour, RoughContour } from "../context";

/**
 * {@link RoughContour} represented in {@link RationalPath}s.
 * The meaning of {@link $outer} and {@link $inner} here follows that of {@link RoughContour}.
 */
interface RationalContour {
	/** See {@link RoughContour.$outer}. */
	$outer: RationalPathEx[];

	/** See {@link RoughContour.$inner}. */
	$inner?: RationalPathEx[];

	$leaves: readonly number[];
}

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
	const result: RationalContour[] = g.$roughContours.map(toRationalContour);

	// To temporarily disable pattern contour, comment the following two lines.
	insertOuter(g.$patternContours, result);
	insertInner(childrenPatternContours, result);

	const contours = result.map(toGraphicalContour);
	g.$contours = g.$raw ? reunionRaw(contours) : contours;
}

function insertOuter(patternContours: PatternContour[], result: RationalContour[]): void {
	for(const contour of patternContours) {
		if(contour.$for !== undefined) {
			// If we know the pairing, we can process directly
			tryInsertOuter(contour, result[contour.$for]);
		} else {
			// Otherwise fallback to trying each rough contour
			for(const rough of result) {
				if(tryInsertOuter(contour, rough)) break;
			}
		}
	}
}

function tryInsertOuter(patternContour: PatternContour, rough: RationalContour): boolean {
	for(const outer of rough.$outer) {
		if(tryInsert(outer, patternContour)) return true;
	}
	return false;
}

function insertInner(childrenPatternContours: PatternContour[], result: RationalContour[]): void {
	for(const childContour of childrenPatternContours) {
		tryInsertInner(childContour, result);
	}
}

function tryInsertInner(childContour: PatternContour, result: RationalContour[]): void {
	for(const contour of result) {
		if(!contour.$inner) continue;
		// if(childContour.$leaves.every(l => contour.$leaves.includes(l))) debugger;
		for(const inner of contour.$inner) {
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

function toRationalContour(contour: RoughContour): RationalContour {
	return {
		$outer: contour.$outer.map(toRationalPath),
		$inner: contour.$inner?.map(toRationalPath),
		$leaves: contour.$leaves,
	};
}

/**
 * Convert {@link RationalContour} to the actual {@link Contour} for rendering.
 * It reverses the role of outer and inner paths if necessary.
 */
function toGraphicalContour(contour: RationalContour): Contour {
	let outer: PathEx | undefined;
	let inner = contour.$inner?.map(simplify);
	let outers = contour.$outer.map(simplify);
	if(outers.length > 1) outers = generalUnion.$get(outers);
	if(outers.length <= 1) {
		outer = outers[0];
	} else {
		for(const path of outers) {
			if(isClockwise(path)) {
				if(!inner) inner = [];
				inner.push(path);
			} else {
				fixPath(path);
				outer = path;
			}
		}
	}
	if(!outer || !outer.length) {
		return { outer: inner![0] };
	} else if(outer.isHole && inner) {
		const innerHoleIndex = inner.findIndex(p => p.isHole);
		if(innerHoleIndex >= 0) {
			inner.push(outer);
			outer = inner[innerHoleIndex];
			inner.splice(innerHoleIndex, 1);
		}
	}
	return { outer, inner };
}

function simplify(path: RationalPathEx): PathEx {
	const deduplicated = deduplicate(toPath(path));
	const l = deduplicated.length;
	deduplicated.push(deduplicated[0]);
	const result: PathEx = [];
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const prev = deduplicated[j];
		const p = deduplicated[i];
		const next = deduplicated[i + 1];
		if((prev.x != p.x || next.x != p.x) && (prev.y != p.y || next.y != p.y)) result.push(p);
	}
	if(path.isHole) result.isHole = true;
	return result;
}

function reunionRaw(contours: Contour[]): Contour[] {
	const outers = generalUnion.$get(contours.map(c => c.outer));
	const inners = generalUnion
		.$get(contours.filter(c => c.inner).flatMap(c => c.inner!))
		.map(p => p.toReversed());
	return stacking.$get(...outers, ...inners);
}

const stacking = new Stacking();
