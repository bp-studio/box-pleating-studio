import { Line, getIntersection } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { Rectangle } from "core/math/geometry/rectangle";
import { SlashDirection } from "shared/types/direction";

import type { IIntersection } from "core/math/geometry/line";
import type { Vector } from "core/math/geometry/vector";
import type { SideDiagonal } from "./configuration";
import type { RoughContour } from "shared/types/geometry";
import type { Repository } from "./repository";
import type { PatternContour } from "../context";

interface JIntersection extends IIntersection {
	angle: number;
}

interface Ray {
	point: Point;
	vector: Vector;
}

//=================================================================
/**
 * {@link Trace} is the utility class for generating {@link PatternContour}.
 */
//=================================================================
export class Trace {

	private readonly _ridges: readonly Line[];
	private readonly _direction: SlashDirection;
	private readonly _sideDiagonals: readonly SideDiagonal[];
	private readonly _boundingBox: Rectangle;

	constructor(repo: Repository) {
		this._ridges = repo.$pattern!.$devices.flatMap(d => d.$traceRidges);
		this._direction = repo.$direction;
		const sideDiagonals = repo.$configuration!.$sideDiagonals;
		this._boundingBox = getBoundingBox(this._ridges.concat(sideDiagonals));
		this._sideDiagonals = sideDiagonals.filter(d => !d.$isDegenerated);
	}

	public $generate(rough: RoughContour): PatternContour | null {
		const candidates = this._candidateRoughContourLines(rough);
		if(!candidates) return null;

		const path: Point[] = [];
		const ridges = new Set(this._ridges);
		const diagonals = new Set(this._sideDiagonals);

		let cursor = this._findInitialRay(candidates, ridges, diagonals);
		if(!cursor) return null;
		path.push(cursor.point);

		for(const diagonal of diagonals) ridges.add(diagonal);

		// Main loop
		while(true) {
			const intersection = getNextIntersection(ridges, cursor);
			if(!intersection) {
				if(testEnd(candidates, cursor)) break;
				else return null; // Something went wrong. Output nothing.
			}
			if(diagonals.has(intersection.line as SideDiagonal)) {
				path.push(intersection.point);
				break;
			}
			ridges.delete(intersection.line);
			cursor = {
				point: intersection.point,
				vector: intersection.line.$reflect(cursor.vector),
			};
			path.push(cursor.point);
		}

		return path.map(p => p.$toIPoint());
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Find the first candidate line that intersects the pattern, and decide the initial ray.
	 */
	private _findInitialRay(candidates: Line[], ridges: Set<Line>, diagonals: Set<SideDiagonal>): Ray | null {
		while(candidates.length) {
			const line = candidates.shift()!;
			const v = line.$vector;
			const ray = { point: line.p1, vector: v };

			// Case 1: side diagonals
			for(const diagonal of diagonals) {
				const p = line.$intersection(diagonal);
				if(!p) continue;
				diagonals.delete(diagonal);
				const hv = this._diagonalHitInitialVector(line, v, diagonal);
				if(!p.eq(diagonal.p0)) {
					return { point: p, vector: hv };
				} else {
					// In this case we modify the ray and go to the case 2.
					ray.vector = hv;
					ray.point = p.sub(hv);
					break;
				}
			}

			// Case 2: normal ridges
			const intersection = getNextIntersection(ridges, ray, true);
			if(intersection) {
				ridges.delete(intersection.line);
				return {
					point: intersection.point,
					vector: intersection.line.$reflect(ray.vector),
				};
			}
		}
		return null;
	}

	/**
	 * If the first line hit by a candidate line is a {@link SideDiagonal},
	 * it may or may not reflect about it, depending on whether the {@link RoughContour}
	 * wraps around {@link SideDiagonal.p0}.
	 */
	private _diagonalHitInitialVector(line: Line, v: Vector, diagonal: SideDiagonal): Vector {
		const outside = line.$isOnRight(diagonal.p0, true);
		const forward = this._direction == SlashDirection.FW;
		const resultIsVertical = forward == outside;
		const lineIsVertical = v.x == 0;
		return resultIsVertical == lineIsVertical ? v : diagonal.$reflect(v);
	}

	/**
	 * Find lines in the {@link RoughContour} that might intersect with the pattern,
	 * in counter-clockwise ordering.
	 */
	private _candidateRoughContourLines(rough: RoughContour): Line[] | null {
		const start = rough.startIndices[this._direction];
		if(isNaN(start)) return null;

		const result = [];
		const l = rough.outer.length;
		for(let i = 0; i < l; i++) {
			const p1 = new Point(rough.outer[(start + i) % l]);
			const p2 = new Point(rough.outer[(start + i + 1) % l]);
			// This checking is valid as the lines in the RoughContour are all AA lines,
			// and it is not possible that a single line get across the pattern bounding box.
			if(!this._boundingBox.$contains(p1) && !this._boundingBox.$contains(p2)) {
				continue;
			}
			result.push(new Line(p1, p2));
		}
		return result.length ? result : null;
	}
}

/**
 * Return a bounding box that contains the entire pattern,
 * for quickly skipping intersection checking.
 *
 * It does not suffice to use just the tips of the {@link Quadrant}s involved,
 * as the entire pattern can actually go beyond that.
 * We have to consider the actual lines of the pattern.
 */
function getBoundingBox(lines: Line[]): Rectangle {
	const points = lines.map(l => l.p1).concat(lines.map(l => l.p2));
	const xs = points.map(p => p.x);
	const ys = points.map(p => p.y);
	return new Rectangle(
		{ x: Math.min(...xs), y: Math.min(...ys) },
		{ x: Math.max(...xs), y: Math.max(...ys) }
	);
}

function getNextIntersection(lines: Iterable<Line>, ray: Ray, lineMode = false): JIntersection | null {
	let result: JIntersection | null = null;
	const { point, vector } = ray;
	const self = new Line(point, vector);
	for(const line of lines) {
		const intersection = getIntersection(line, point, vector, true, lineMode) as JIntersection;
		if(!intersection) continue;

		if(
			!isSideDiagonal(intersection.line) && (
				intersection.point.eq(line.p1) && self.$isOnRight(line.p2) ||
				intersection.point.eq(line.p2) && self.$isOnRight(line.p1)
			)
		) continue;

		intersection.angle = getAngle(vector, line.$vector);
		if(isCloser(intersection, result)) result = intersection;
	}
	return result;
}

function getAngle(v1: Vector, v2: Vector): number {
	let ang = v1.$angle - v2.$angle;
	while(ang < 0) ang += Math.PI;
	while(ang > Math.PI) ang -= Math.PI;
	return ang;
}

function isCloser(r: JIntersection, x: JIntersection | null): boolean {
	return x == null ||
		r.dist.lt(x.dist) ||
		r.dist.eq(x.dist) && (
			// SideDiagonals should always go first.
			isSideDiagonal(r.line) ||
			!isSideDiagonal(x.line) && r.angle < x.angle
		);
}

function isSideDiagonal(line: Line): line is SideDiagonal {
	return "p0" in line;
}

/** Check if we have successfully connected back to the {@link RoughContour}. */
function testEnd(candidates: Line[], ray: Ray): boolean {
	for(const candidate of candidates) {
		if(candidate.$contains(ray.point) && candidate.$vector.$parallel(ray.vector)) return true;
	}
	return false;
}
