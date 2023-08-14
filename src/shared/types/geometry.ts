import type { SlashDirection } from "./direction";

export interface IPointEx extends IPoint {
	arc?: IPoint;
	r?: number;
}

export type Path = IPointEx[] & {

	/** In the use case of union, indicating from which polygons this path forms */
	from?: number[];

	/** Whether this path is a hole. */
	isHole?: boolean;

	repo?: string;
};

export type ILine = [IPoint, IPoint];

export type Polygon = Path[];

export function same(p1: IPoint, p2: IPoint): boolean {
	return p1.x === p2.x && p1.y === p2.y;
}

export function dist(p1: IPoint, p2: IPoint): number {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/** Contour format. a set of contours consists of an outer path plus a number of inner holes. */
export type Contour = {

	/** Outer path of the contour. */
	outer: Path;

	/** Inner holes of the contour, if any. */
	inner?: Path[];

	/** Whether this contour is a hole itself. */
	isHole?: boolean;
};

/**
 * Indices of corners in {@link Contour.outer} such that they can
 * be used as safe starting point for contour processing
 * (i.e. they are not involved in patterns of the given {@link SlashDirection}).
 * The value `NaN` implies this contour may be safely skipped.
 */
export type StartIndexMap = [number, number] & { [d in SlashDirection]: number };

export interface RoughContour extends Contour {
	/** See {@link StartIndexMap}. */
	startIndices: StartIndexMap;
}

/** Sort first by x-coordinate, then by y-coordinate */
export function xyComparator(p1: IPoint, p2: IPoint): number {
	return p1.x - p2.x || p1.y - p2.y;
}

export function toString(p: IPointEx): string {
	if(p.arc) return `(${p.x},${p.y},${p.arc.x},${p.arc.y},${p.r!})`;
	return `(${p.x},${p.y})`;
}

/** Reverses the direction of all paths in a polygon and returns the new polygon */
export function reverse(polygon: Polygon): Polygon {
	return polygon.map(path => path.toReversed());
}
