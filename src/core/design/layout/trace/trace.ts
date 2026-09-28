import { SlashDirection } from "shared/types/direction";
import { CornerType } from "shared/json/enum";
import { TraceContext, getNextIntersection } from "./traceContext";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";

import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Ridge } from "../pattern/device";
import type { SideDiagonal } from "../configuration";
import type { NodeStart } from "../pattern/quadrant";
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

	/**
	 * @param nodeStart The starting point specific to the node being traced (see {@link Quadrant.$startPointFor}).
	 * If it differs from `start`, the region next to the hinge between the two is filled by the flaps inside the node,
	 * so the side diagonal emerges from `nodeStart` instead of `start`,
	 * and the outgoing ridges ending in the filled region are terminated there.
	 */
	public $generate(
		hinges: Path, start: Point, end: Point, rawMode: boolean, nodeStart?: NodeStart
	): PatternContour | null {
		const ctx = new TraceContext(this, hinges);
		if(!ctx.$valid) return null;

		const directionalVector = new Vector(1, this.$direction == SlashDirection.FW ? 1 : -1);
		const ridges = this._createFilteredRidges(start, end, directionalVector);

		// Initialize
		const path: RationalPath = [];
		let startDiagonal = this.$sideDiagonals.find(d => d.$lineContains(start));
		if(startDiagonal && nodeStart?.filled) {
			startDiagonal = Trace._applyFilledRegion(startDiagonal, start, nodeStart as Required<NodeStart>, ridges);
		}
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
		else return Trace._rawModeFinalCheck(result, hinges, cursor.vector);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * When the region next to the hinge between `start` and the node-specific starting point
	 * is filled by the flaps inside the node, the filled region acts like a flap region:
	 * the side diagonal emerges from the far corner of the region on the hinge (the node-specific starting point),
	 * and a diagonal ridge emerges from the far corner of the region inside the flap,
	 * except that the outgoing ridges ending in the filled region are terminated there instead
	 * (in which case they cancel out with the emerging diagonal).
	 */
	private static _applyFilledRegion(
		diagonal: SideDiagonal, start: Point, nodeStart: Required<NodeStart>, ridges: Set<Ridge>
	): SideDiagonal {
		const { point, filled } = nodeStart;
		let terminated = false;
		for(const ridge of ridges) {
			const { x, y } = ridge.p2;
			if(ridge.$type !== undefined && filled.x1 <= x && x <= filled.x2 && filled.y1 <= y && y <= filled.y2) {
				ridges.delete(ridge);
				terminated = true;
			}
		}

		// The side diagonal is shifted to the node-specific starting point
		const v = diagonal.$vector;
		const shifted = new Line(point, v) as Partial<Writeable<SideDiagonal>>;
		shifted.p0 = diagonal.p0.$sub(start.$sub(point));

		// The diagonal ridge from the inner corner, pointing outwards (i.e. away from the side corner)
		if(!terminated) {
			const vertical = point.x == start.x; // Whether the hinge is vertical
			const inner = vertical ?
				new Point(point.x == filled.x1 ? filled.x2 : filled.x1, point.y) :
				new Point(point.x, point.y == filled.y1 ? filled.y2 : filled.y1);
			const outward = diagonal.p0.$sub(diagonal.p1).$dot(v) > 0 ? v.$neg : v;
			const ridge = new Line(inner, inner.$sub(outward.$neg)) as Ridge;
			ridge.$type = CornerType.side;
			ridges.add(ridge);
		}
		return shifted as SideDiagonal;
	}

	/**
	 * In raw mode, we need to make some extra checks to make sure the
	 * generated contour actually fits the given hinge segment.
	 */
	private static _rawModeFinalCheck(
		result: PatternContour | null,
		hinges: Path,
		lastVec: Vector
	): PatternContour | null {
		if(!result) return null;

		// First we quickly check if the last point is on the hinges.
		const hingeLines: Line[] = [];
		const lastPoint = result[result.length - 1];
		for(let i = hinges.length - 1; i > 0; i--) {
			const line = Line.$fromIPoint(hinges[i], hinges[i - 1]);
			hingeLines.push(line);
			if(line.$contains(lastPoint, true)) return result;
		}

		const findIntersection = (pt: Point, v: Vector) => {
			for(const hinge of hingeLines) {
				const intersection = hinge.$intersection(pt, v, true);
				if(intersection) return intersection;
			}
			return null;
		};

		// Otherwise, try to find the intersection of the last known cursor direction with the hinges.
		if(lastVec.x == 0 || lastVec.y == 0) {
			const intersection = findIntersection(result[result.length - 1], lastVec);
			if(intersection) {
				result.push(intersection);
				return result;
			}
		}

		// If the above still doesn't work, try popping the tail segments and retry.
		// It is not known if this is actually helpful,
		// as I don't have a sample that really requires this for a valid rendering.
		// However, the follow paths can be triggered by dragging Imai's JSP.
		/* istanbul ignore next: significance unsure */
		for(let i = result.length - 1; i > 0; i--) {
			const last = result[i];
			const prev = result[i - 1];
			const vec = last.$sub(prev);

			// If the segment is not orthogonal, we're out of luck.
			if(vec.x != 0 && vec.y != 0) break;

			result.pop();
			const intersection = findIntersection(prev, vec);
			if(intersection) {
				result.push(intersection);
				return result;
			}
		}
		return null; // Out of luck
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
