import { rotate } from "shared/utils/array";
import { Line } from "./line";
import { Point } from "./point";
import { Matrix } from "./matrix";
import { Vector } from "./vector";

import type { NodeId } from "shared/json/tree";
import type { PathEx } from "shared/types/geometry";

/**
 * This type signify that the array is intended to be a connected path,
 * rather than merely a collection of {@link Point}s.
 */
export type RationalPath = Point[];

export interface RationalPathEx extends RationalPath {
	isHole?: boolean;
	leaves?: NodeId[];
}

export function toRationalPath(path: PathEx): RationalPathEx {
	const result: RationalPathEx = path.map(p => new Point(p));
	result.isHole = path.isHole;
	result.leaves = path.leaves;
	return result;
}

export function toPath(path: RationalPathEx): PathEx {
	const result: PathEx = path.map(p => p.$toIPoint());
	result.isHole = path.isHole;
	return result;
}

/** Convert a path to {@link Line} objects. */
export function toLines(path: RationalPath): Line[] {
	return path.map((p, i) => new Line(p, path[i + 1] || path[0]));
}

/**
 * Given a triangle, let the first vertex stays stationary,
 * and move the second vertex to the given target while keeping triangle similar.
 * @returns The third vertex after the moving.
 */
export function triangleTransform(triangle: RationalPath, to: Point): Point | null {
	const [p1, p2, p3] = triangle;
	const [v1, v2, v3] = [to, p2, p3].map(p => p.sub(p1));

	// TODO: It is not yet clear why this might happen. More investigation is needed.
	if(v2.eq(Vector.ZERO) || v1.eq(Vector.ZERO)) return null;

	const m = Matrix.$getTransformMatrix(v2, v1);
	return p1.$add(m.$multiply(v3));
}

/**
 * Join path p1 and p2, and return the new path.
 *
 * This algorithm assumes the two path are oriented the same way,
 * and shares exactly one edge.
 */
export function join(p1: RationalPath, p2: RationalPath): RationalPath {
	p1 = p1.concat(); p2 = p2.concat();
	for(let i = 0; i < p1.length; i++) {
		for(let j = 0; j < p2.length; j++) {
			if(p1[i].eq(p2[j])) {
				rotate(p2, j);
				p1.splice(i, 2, ...p2);
				return p1;
			}
		}
	}
	return p1;
}

export function shift(path: RationalPath, v: Vector): RationalPath {
	return path.map(p => p.$add(v));
}
