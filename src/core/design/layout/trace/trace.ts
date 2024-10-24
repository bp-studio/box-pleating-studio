import { SlashDirection } from "shared/types/direction";
import { TraceContext, getNextIntersection } from "./traceContext";
import { Line } from "core/math/geometry/line";
import { Vector } from "core/math/geometry/vector";

import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Point } from "core/math/geometry/point";
import type { Ridge } from "../pattern/device";
import type { SideDiagonal } from "../configuration";
import type { Path } from "shared/types/geometry";
import type { PatternContour } from "../../context";

//=================================================================
/**
 * {@link Trace} is the utility class for generating {@link PatternContour}.
 */
//=================================================================
export class Trace {

	public readonly $direction: SlashDirection;

	protected readonly $ridges: readonly Ridge[];
	protected readonly $sideDiagonals: readonly SideDiagonal[];

	constructor(ridges: readonly Ridge[], dir: SlashDirection, sideDiagonals: readonly SideDiagonal[]) {
		this.$ridges = ridges;
		this.$direction = dir;
		this.$sideDiagonals = sideDiagonals.filter(d => !d.$isDegenerated);
	}

	public $generate(hinges: Path, start: Point, end: Point, rawMode: boolean): PatternContour | null {
		const ctx = new TraceContext(this, hinges);
		if(!ctx.$valid) return null;

		const directionalVector = new Vector(1, this.$direction == SlashDirection.FW ? 1 : -1);
		const ridges = this._createFilteredRidges(start, end, directionalVector);

		// Initialize
		const path: RationalPath = [];
		const startDiagonal = this.$sideDiagonals.find(d => d.$lineContains(start));
		let cursor = ctx.$getInitialNode(ridges, startDiagonal);
		if(!cursor) return null;
		path.push(cursor.point);

		const endDiagonal = this.$sideDiagonals.find(d => d.$contains(end, true));
		if(endDiagonal) ridges.add(endDiagonal);

		// Main loop
		while(true) {
			const intersection = getNextIntersection(ridges, cursor);
			if(!intersection) break;

			ridges.delete(intersection.line);
			cursor = {
				last: intersection.line.$vector,
				point: intersection.point,
				vector: intersection.line.$reflect(cursor.vector),
			};

			const lastPoint = path[path.length - 1];
			if(!lastPoint.eq(cursor.point)) {
				const line = new Line(lastPoint, cursor.point);
				const test = line.$intersection(end, directionalVector);
				if(test && !test.eq(cursor.point)) break; // early stop
				path.push(cursor.point);
			}
		}

		const result = ctx.$trim(path);
		if(!rawMode) return result;
		else return Trace._rawModeFinalCheck(result, hinges);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * In raw mode, we need to make some extra checks to make sure the
	 * generated contour actually fits the given hinge segment.
	 */
	private static _rawModeFinalCheck(result: PatternContour | null, hinges: Path): PatternContour | null {
		if(!result) return null;

		// First we quickly check if the last point is on the hinges.
		const hingeLines: Line[] = [];
		const lastPoint = result[result.length - 1];
		for(let i = hinges.length - 1; i > 0; i--) {
			const line = Line.$fromIPoint(hinges[i], hinges[i - 1]);
			hingeLines.push(line);
			if(line.$contains(lastPoint, true)) return result;
		}

		// Otherwise, try to find the intersection of the last pattern segment (as ray) with the hinges.
		for(let i = result.length - 1; i > 0; i--) {
			const last = result[i];
			const prev = result[i - 1];
			const vec = last.$sub(prev);

			// If the segment is not orthogonal, we're out of luck.
			if(vec.x != 0 && vec.y != 0) break;

			result.pop();
			for(const hinge of hingeLines) {
				const intersection = hinge.$intersection(prev, vec, true);
				if(intersection) {
					result.push(intersection);
					return result;
				}
			}
		}

		/// #if DEBUG
		/* istanbul ignore next: debug */
		debugger; // Not supposed to get here in theory
		/// #endif
		return null;
	}

	private _createFilteredRidges(start: Point, end: Point, directionalVector: Vector): Set<Ridge> {
		let startLine = new Line(start, directionalVector);
		let endLine = new Line(end, directionalVector);

		// Oriented start/end lines
		if(startLine.$pointIsOnRight(end)) startLine = startLine.$reverse();
		if(endLine.$pointIsOnRight(start)) endLine = endLine.$reverse();

		const filteredRidges = this.$ridges.filter(r =>
			(!startLine.$pointIsOnRight(r.p1, true) || !startLine.$pointIsOnRight(r.p2, true)) &&
			(!endLine.$pointIsOnRight(r.p1, true) || !endLine.$pointIsOnRight(r.p2, true) ||
				// Include the intersection ridge when applicable
				endLine.$lineContains(r.p1) && endLine.$lineContains(r.p2))
		);
		return new Set(filteredRidges);
	}
}
