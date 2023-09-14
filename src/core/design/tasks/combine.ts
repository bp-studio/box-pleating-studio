import { Line } from "core/math/geometry/line";
import { toPath, toRationalPath } from "core/math/geometry/rationalPath";
import { deduplicate } from "core/math/geometry/path";
import { dist } from "shared/types/geometry";

import type { Contour, Path } from "shared/types/geometry";
import type { ITreeNode, PatternContour } from "../context";
import type { Point } from "core/math/geometry/point";

interface RationalContour {
	outer: Point[];
	inner?: Point[][];
	isHole?: boolean;
}

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

	// if(node.id == 3) debugger;

	// To temporarily disable pattern contour, comment the following two lines.
	insertOuter(g.$patternContours, result);
	insertInner(childrenPatternContours, result);

	g.$contours = result.map(toContour);
}

function insertOuter(patternContours: PatternContour[], result: RationalContour[]): void {
	const remaining: PatternContour[] = [];
	for(const contour of patternContours) {
		if(!tryInsert(result[contour.$for].outer, contour)) {
			remaining.push(contour);
		}
	}
	if(remaining.length == 0) return;
	for(const linkedContour of linkContours(remaining)) {
		const ok = tryInsert(result[linkedContour.$for].outer, linkedContour);
		// if(!ok) debugger;
	}
}

function insertInner(childrenPatternContours: PatternContour[], result: RationalContour[]): void {
	const remaining: PatternContour[] = [];
	for(const childContour of childrenPatternContours) {
		if(!tryInsertInner(childContour, result)) {
			remaining.push(childContour);
		}
	}
	if(remaining.length == 0) return;
	// console.log(remaining.map(r => [r, r.map(p => p.toString())]));
	for(const linkedContour of linkContours(remaining)) {
		tryInsertInner(linkedContour, result);
	}
}

function tryInsertInner(childContour: PatternContour, result: RationalContour[]): boolean {
	for(const contour of result) {
		if(!contour.inner) continue;
		for(const inner of contour.inner) {
			if(tryInsert(inner, childContour)) return true;
		}
	}
	return false;
}

function tryInsert(path: Point[], insert: PatternContour): boolean {
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

function linkContours(contours: (PatternContour | null)[]): PatternContour[] {
	for(let i = 0; i < contours.length - 1; i++) {
		for(let j = i + 1; j < contours.length; j++) {
			const c1 = contours[i], c2 = contours[j];
			if(!c1 || !c2 || c1.$for != c2.$for) continue;
			const t1 = testLink(c1, c2), t2 = testLink(c2, c1);
			if(t1 === undefined && t2 === undefined) continue;
			const linkedContour = t2 === undefined || t1 !== undefined && t1 < t2 ? link(c1, c2) : link(c2, c1);
			console.log(linkedContour.map(p => p.toString()));
			linkedContour.$for = c1.$for;
			linkedContour.$linked = true;
			contours[i] = linkedContour;
			contours[j] = null;
		}
	}
	return contours.filter(c => c && c.$linked) as PatternContour[];
}

function testLink(c1: PatternContour, c2: PatternContour): number | undefined {
	const l = c1.length - 1;
	if(c1[l].x != c2[0].x && c1[l].y != c2[0].y) return undefined;
	return dist(c1[l], c2[0]);
}

function link(c1: PatternContour, c2: PatternContour): PatternContour {
	const result: Point[] = [];
	result.push(...c1, ...c2);
	return result as PatternContour;
}

function toRationalContour(contour: Contour): RationalContour {
	return {
		outer: toRationalPath(contour.outer),
		inner: contour.inner?.map(toRationalPath),
		isHole: contour.isHole,
	};
}

function toContour(contour: RationalContour): Contour {
	return {
		outer: simplify(contour.outer),
		inner: contour.inner?.map(simplify),
		isHole: contour.isHole,
	};
}

function simplify(path: Point[]): Path {
	const deduplicated = deduplicate(toPath(path));
	const l = deduplicated.length;
	deduplicated.push(deduplicated[0]);
	const result: Path = [];
	for(let i = 0, j = l - 1; i < l; j = i++) {
		const prev = deduplicated[j];
		const p = deduplicated[i];
		const next = deduplicated[i + 1];
		if((prev.x != p.x || next.x != p.x) && (prev.y != p.y || next.y != p.y)) result.push(p);
	}
	return result;
}
