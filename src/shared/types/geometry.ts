
export type Path = IPoint[];

export type ILine = [IPoint, IPoint];

export type Polygon = Path[];

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

	/** In raw mode, store the leaf ids involved in this path. */
	leaves?: number[];

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

/** Reverses the direction of all paths in a {@link Polygon} and returns the new polygon */
export function reverse(polygon: Polygon): Polygon {
	return polygon.map(path => path.toReversed());
}
