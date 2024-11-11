import type { NodeId } from "shared/json/tree";

export type Path = IPoint[];

export type ILine = [IPoint, IPoint];

export type Polygon = Path[];

/**
 * Matrix [a, b, c, d, tx, ty] so that the transformation is:
 * ```
 * |a b||x|   |tx|
 * |   || | + |  |
 * |c d||y|   |ty|
 * ```
 * Note that this is different from the ordering used in Pixi.js.
 */
export type TransformationMatrix = [number, number, number, number, number, number];

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Arc
/////////////////////////////////////////////////////////////////////////////////////////////////////

export interface IArcPoint extends IPoint {
	arc?: IPoint;
	r?: number;
}

export type ArcPath = IArcPoint[];

export type ArcPolygon = ArcPath[];

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Contour
/////////////////////////////////////////////////////////////////////////////////////////////////////

export type PathEx = Path & {

	/** In the use case of union, the id of a representative polygon from which this path forms. */
	from?: number;

	/** In raw mode, store the ids of the leaves wrapped inside this path. */
	leaves?: NodeId[];

	/** Whether this path is a hole. */
	isHole?: boolean;
};

/** Contour format. a set of contours consists of an outer path plus some inner holes. */
export interface Contour {

	/** Outer path of the contour. */
	outer: Path;

	/** Inner holes of the contour, if any. */
	inner?: PathEx[];
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
/////////////////////////////////////////////////////////////////////////////////////////////////////

export function same(p1: IPoint, p2: IPoint): boolean {
	return p1.x === p2.x && p1.y === p2.y;
}

export function dist(p1: IPoint, p2: IPoint): number {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return norm(dx, dy);
}

export function norm(x: number, y: number): number {
	return Math.sqrt(x * x + y * y);
}

export function leg(c: number, b: number): number {
	return Math.sqrt(c * c - b * b);
}

/** Sort first by x-coordinate, then by y-coordinate */
export function xyComparator(p1: IPoint, p2: IPoint): number {
	return p1.x - p2.x || p1.y - p2.y;
}

export function applyTransform(pt: IPoint, matrix: TransformationMatrix): IPoint {
	const [a, b, c, d, x, y] = matrix;
	return {
		x: pt.x * a + pt.y * b + x,
		y: pt.x * c + pt.y * d + y,
	};
}
