import { Line } from "core/math/geometry/line";
import { toPath, toRationalPath } from "core/math/geometry/rationalPath";
import { deduplicate } from "core/math/geometry/path";
import { GeneralUnion } from "core/math/polyBool/general/generalUnion";

import type { RationalPath, RationalPathEx } from "core/math/geometry/rationalPath";
import type { Contour, PathEx } from "shared/types/geometry";
import type { ITreeNode, PatternContour, RoughContour } from "../context";

/**
 * {@link RoughContour} represented in {@link RationalPath}s.
 * The meaning of {@link $outer} and {@link $inner} here follows that of {@link RoughContour}.
 */
interface RationalContour {
	$outer: RationalPathEx;
	$inner?: RationalPathEx[];
}

const generalUnion = new GeneralUnion();

export function combineContour(node: ITreeNode): void {
	const g = node.$graphics;
	const childrenPatternContours: PatternContour[] = [];
	for(const child of node.$children) {
		// There's no need to process a child pattern contour if the
		// corresponding pattern does not involve the current node
		const contours = child.$graphics.$patternContours.filter(p => p.$ids.includes(node.id));
		childrenPatternContours.push(...contours);
	}
	const result: RationalContour[] = g.$roughContours.map(toRationalContour);

	// To temporarily disable pattern contour, comment the following two lines.
	insertOuter(g.$patternContours, result);
	insertInner(childrenPatternContours, result);

	let contours = result.map(toGraphicalContour);
	if(g.$raw) {
		contours = generalUnion
			.$get(...contours.map(c => [c.outer]))
			.map(p => {
				const innerContours = p.from!.flatMap(i => contours[i].inner || []);
				const inner = generalUnion.$get(...innerContours.map(c => [c]));
				return { outer: p, inner };
			});
	}
	g.$contours = contours;
}

function insertOuter(patternContours: PatternContour[], result: RationalContour[]): void {
	for(const contour of patternContours) {
		if(contour.$for !== undefined) {
			// If we know the pairing, we can process directly
			tryInsert(result[contour.$for].$outer, contour);
		} else {
			// Otherwise fallback to trying each rough contour
			for(const rough of result) {
				if(tryInsert(rough.$outer, contour)) break;
			}
		}
	}
}

function insertInner(childrenPatternContours: PatternContour[], result: RationalContour[]): void {
	for(const childContour of childrenPatternContours) {
		tryInsertInner(childContour, result);
	}
}

function tryInsertInner(childContour: PatternContour, result: RationalContour[]): void {
	for(const contour of result) {
		if(!contour.$inner) continue;
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
		$outer: toRationalPath(contour.$outer),
		$inner: contour.$inner?.map(toRationalPath),
	};
}

/**
 * Convert {@link RationalContour} to the actual {@link Contour} for rendering.
 * It reverses the role of outer and inner paths if necessary.
 */
function toGraphicalContour(contour: RationalContour): Contour {
	let outer = simplify(contour.$outer);
	const inner = contour.$inner?.map(simplify);
	if(!outer.length) {
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
