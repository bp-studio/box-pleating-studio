import { SlashDirection } from "shared/types/direction";
import { TraceContext, getNextIntersection, isSideDiagonal } from "./traceContext";
import { debugAssert } from "core/utils/debug";
import { Line } from "core/math/geometry/line";
import { Vector } from "core/math/geometry/vector";

import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Point } from "core/math/geometry/point";
import type { Ridge } from "../pattern/device";
import type { TraceNode, VirtualDiagonal } from "./traceContext";
import type { SideDiagonal } from "../configuration";
import type { Path } from "shared/types/geometry";
import type { NodeId } from "shared/json/tree";
import type { PatternContour } from "../../context";
import type { getQuadrantShape } from "core/design/tasks/utils/rawPiece";

/** The starting/ending points of tracing. */
export interface StartEnd {
	start: Point;
	end: Point;
	/**
	 * If defined, the starting point is not on an actual {@link SideDiagonal}
	 * but on this intersection ridge (whose line then acts as a virtual side
	 * diagonal, with the starting point as its corner). This happens when the
	 * side diagonal is digested by the flaps wrapped inside the node being
	 * traced, or belongs to a flap outside the node.
	 */
	startRidge?: Ridge;
}

//=================================================================
/**
 * {@link Trace} is the utility class for generating {@link PatternContour}.
 */
//=================================================================
export class Trace {

	public readonly $direction: SlashDirection;

	protected readonly $ridges: readonly Ridge[];
	protected readonly $sideDiagonals: readonly SideDiagonal[];

	constructor(
		ridges: readonly Ridge[], dir: SlashDirection,
		sideDiagonals: readonly SideDiagonal[]
	) {
		this.$ridges = ridges;
		this.$direction = dir;
		this.$sideDiagonals = sideDiagonals.filter(d => !d.$isDegenerated);
	}

	/**
	 * @param inside The leaves inside the contour being traced. The
	 * intersection ridges between them are ignored (see
	 * {@link _createFilteredRidges}), and their flaps shape the hinges in raw
	 * mode (see {@link _rawModeFinalCheck}).
	 */
	public $generate(
		hinges: Path, start: Point, end: Point, rawMode: boolean,
		startRidge?: Ridge,
		inside: ReadonlySet<NodeId> = new Set()
	): PatternContour | null {
		const ctx = new TraceContext(this, hinges);
		if(!ctx.$valid) return null;

		const directionalVector =
			new Vector(1, this.$direction == SlashDirection.FW ? 1 : -1);
		const ridges =
			this._createFilteredRidges(start, end, directionalVector, inside);

		// Initialize
		const path: RationalPath = [];
		let startDiagonal =
			this.$sideDiagonals.find(d => d.$lineContains(start));
		if(!startDiagonal && startRidge) {
			startDiagonal =
				createVirtualDiagonal(start, directionalVector, startRidge);
		}
		const cursor = ctx.$getInitialNode(ridges, startDiagonal);
		if(!cursor) return null;
		path.push(cursor.point);

		const endDiagonal =
			this.$sideDiagonals.find(d => d.$contains(end, true));
		if(endDiagonal) ridges.add(endDiagonal);

		const loop = Trace._mainLoop(
			ridges, cursor, path, end, directionalVector
		);

		// A contour that never reflects on any ridge (side diagonals excluded)
		// merely goes along the hinges, which happens when the hinge segment is
		// irrelevant to the pattern (for example, another part of a piece
		// formed by multiple leaves). There's nothing to trace in that case.
		if(!loop.reflected && !cursor.ridge) return null;

		const result = ctx.$trim(path);
		if(!result) return null;
		if(!rawMode) return result;
		if(extendToHinges(result, hinges, loop.vector)) return result;
		return this._rawModeFinalCheck(inside);
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Keep reflecting on the ridges, and returns whether any ridge (side
	 * diagonals excluded) is reflected on, as well as the direction leaving
	 * the last point.
	 */
	private static _mainLoop(
		ridges: Set<Ridge>, initial: TraceNode, path: RationalPath,
		end: Point, directionalVector: Vector
	): { reflected: boolean, vector: Vector } {
		let cursor = initial;
		let reflected = false;
		while(true) {
			const intersection = getNextIntersection(ridges, cursor);
			if(!intersection) break;

			ridges.delete(intersection.line);
			if(!isSideDiagonal(intersection.line)) reflected = true;
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
		return { reflected, vector: cursor.vector };
	}

	/**
	 * In raw mode, the generated contour must end on the given hinge segment
	 * (after {@link extendToHinges}), so that it can be inserted into the
	 * piece.
	 *
	 * That is the case in valid layouts, as the pieces are carved to match the
	 * tracing (see {@link getQuadrantShape}). In layouts with invalid
	 * junctions, the repo is formed by the valid junctions only, while the
	 * geometry of the pieces could still be affected by the flaps of the
	 * invalid junctions, and the contour could end elsewhere. In that case we
	 * give up the contour. Note that those flaps are not necessarily in the
	 * repo; it suffices that they are inside the contour being traced.
	 *
	 * Note that for the same reason, the contour could also end on the hinges
	 * by chance and still be incorrect, which would leave a small region
	 * uncovered. We accept that, since it only happens in layouts with invalid
	 * junctions, and it is not worth the effort to correct the patterns in
	 * those layouts.
	 */
	private _rawModeFinalCheck(inside: ReadonlySet<NodeId>): null {
		debugAssert(
			() => this._involvesInvalidJunctions(inside),
			"Pattern contour does not end on the hinges"
		);
		return null;
	}

	/**
	 * Whether the flaps involved in the tracing (including those inside the
	 * contour being traced) have invalid junctions.
	 * See {@link _rawModeFinalCheck}.
	 */
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	protected _involvesInvalidJunctions(_inside: ReadonlySet<NodeId>): boolean {
		return false;
	}

	/**
	 * The ridges between the starting and ending lines.
	 *
	 * An intersection ridge is usually treated as a ray (see
	 * {@link getNextIntersection}), as the division of the gadgets continues
	 * into the rivers outside. But if both flaps it divides are inside the
	 * contour being traced, the division is internal to the contour (see
	 * {@link Quadrant.$resolveStartEnd}), and only the ridge itself counts.
	 */
	private _createFilteredRidges(
		start: Point, end: Point, directionalVector: Vector,
		inside: ReadonlySet<NodeId>
	): Set<Ridge> {
		let startLine = new Line(start, directionalVector);
		let endLine = new Line(end, directionalVector);

		// Oriented start/end lines
		if(startLine.$pointIsOnRight(end)) startLine = startLine.$reverse();
		if(endLine.$pointIsOnRight(start)) endLine = endLine.$reverse();

		const filteredRidges = this.$ridges.filter(r =>
			(
				!startLine.$pointIsOnRight(r.p1, true) ||
				!startLine.$pointIsOnRight(r.p2, true)
			) &&
			(
				!endLine.$pointIsOnRight(r.p1, true) ||
				!endLine.$pointIsOnRight(r.p2, true) ||
				// Include the intersection ridge when applicable
				endLine.$lineContains(r.p1) && endLine.$lineContains(r.p2)
			)
		);
		return new Set(filteredRidges.map(r => {
			const internal = r.$division?.every(id => inside.has(id as NodeId));
			return internal ? new Line(r.p1, r.p2) as Ridge : r;
		}));
	}
}

/**
 * Since the tracing records only the points of reflection, the contour stops
 * at the last reflection, and if the contour leaves it in an axis-parallel
 * direction (instead of along a diagonal ending on the hinges), the last
 * segment towards the hinges is missing. In that case we extend the contour
 * to the hinges. Returns whether the contour ends on the hinges.
 */
function extendToHinges(
	result: PatternContour, hinges: Path, vector: Vector
): boolean {
	const lines: Line[] = [];
	for(let i = hinges.length - 1; i > 0; i--) {
		lines.push(Line.$fromIPoint(hinges[i], hinges[i - 1]));
	}
	const lastPoint = result[result.length - 1];
	if(lines.some(line => line.$contains(lastPoint, true))) return true;
	if(vector.x != 0 && vector.y != 0) return false;
	const extension = getNearestIntersection(lines, lastPoint, vector);
	if(!extension) return false;
	result.push(extension);
	return true;
}

/** The nearest intersection of a ray with the given lines, if any. */
function getNearestIntersection(
	lines: readonly Line[], p: Point, v: Vector
): Point | null {
	let result: Point | null = null;
	let min = Number.POSITIVE_INFINITY;
	for(const line of lines) {
		const intersection = line.$intersection(p, v, true);
		if(!intersection) continue;
		const distance = intersection.$sub(p).$dot(v);
		if(distance > 0 && distance < min) {
			result = intersection;
			min = distance;
		}
	}
	return result;
}

/**
 * The side diagonal is digested (see StartEnd.startRidge),
 * so we make a virtual one. Only its line and its corner matter
 * (it is not part of the ridges).
 */
function createVirtualDiagonal(
	start: Point, v: Vector, ridge: Ridge
): SideDiagonal {
	const virtual = new Line(start, v) as Partial<Writeable<VirtualDiagonal>>;
	virtual.p0 = start;
	virtual.$virtual = true;
	if(!ridge.p1.eq(ridge.p2)) {
		virtual.$inner = ridge.p1.eq(start) ? ridge.p2 : ridge.p1;
	}
	return virtual as SideDiagonal;
}
