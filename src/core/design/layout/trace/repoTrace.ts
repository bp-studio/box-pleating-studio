import { pathToString } from "core/math/geometry/path";
import { SlashDirection } from "shared/types/direction";
import { Trace } from "./trace";
import { State } from "core/service/state";
import { QV, minQuadrantWeightComparator, pointWeight } from "../pattern/quadrant";

import type { NodeId } from "shared/json/tree";
import type { Ridge } from "../pattern/device";
import type { Repository } from "../repository";
import type { Point } from "core/math/geometry/point";
import type { Path } from "shared/types/geometry";
import type { Quadrant } from "../pattern/quadrant";
import type { StartEnd } from "./trace";

//=================================================================
/**
 * {@link RepoTrace} is a {@link Trace} class constructed from a
 * {@link Repository}. It also acts as the context object for processing
 * the same repository.
 */
//=================================================================
export class RepoTrace extends Trace {

	public readonly $repo: Repository;
	public readonly $leaves: ReadonlySet<number>;

	constructor(repo: Repository) {
		super(
			repo.$pattern!.$devices.flatMap(d => d.$traceRidges),
			repo.$direction,
			repo.$configuration!.$sideDiagonals
		);
		this.$repo = repo;
		this.$leaves = new Set(repo.$nodeSet.$leaves);
	}

	/**
	 * Determine the starting/ending point of tracing for the contour of a node
	 * (given by its leaves).
	 *
	 * @param filtered The {@link Quadrant}s covered by the node in a specific
	 * direction.
	 * @param all All {@link Quadrant}s of the {@link Repository} in that
	 * direction.
	 * @param leaves The leaves of the node.
	 *
	 * Returns `null` if the node has nothing to trace in that direction.
	 */
	public $resolveStartEnd(
		filtered: Quadrant[], all: Quadrant[], leaves: ReadonlySet<NodeId>
	): StartEnd | null {
		let result: StartEnd | undefined;
		filtered = filtered.filter(quadrant => {
			const resolved = this._resolveQuadrant(quadrant, leaves);
			// The junctions of this quadrant are all digested by the node
			if(!resolved) return false;
			const f = quadrant.f;
			if(!result) {
				result = resolved;
			} else {
				const startWeight = pointWeight(resolved.start, f);
				if(startWeight < pointWeight(result.start, f)) {
					result.start = resolved.start;
					result.startRidge = resolved.startRidge;
				}
				if(pointWeight(resolved.end, f) > pointWeight(result.end, f)) {
					result.end = resolved.end;
				}
			}
			return true;
		});
		if(!result) return null;

		if(filtered.length != all.length) {
			filtered.sort(minQuadrantWeightComparator);
			const first = all.indexOf(filtered[0]);
			const last = all.indexOf(filtered[filtered.length - 1]);
			// If the quadrant has a junction with the flap of the adjacent
			// quadrant (as in the nested overlaps at the ends of a bridge, see
			// Quadrant.$checkValidity), the gadget of that junction lies within
			// the range of the quadrant, so the range is not cut short.
			const isAdjacent = (i: number, j: number): boolean =>
				!all[i].$hasJunctionWith(all[j].$flap.id);
			if(first > 0 && isAdjacent(first, first - 1)) {
				const a = all[first - 1].$flap.id, b = all[first].$flap.id;
				const ridge = this._getIntersectionRidge(a, b);
				// It is possible that the intersection ridge is missing in
				// legacy patterns.
				/* istanbul ignore else: legacy */
				if(ridge) {
					result.start = hingeSideEnd(ridge, all[first]);
					result.startRidge = ridge;
				}
			}
			if(last < all.length - 1 && isAdjacent(last, last + 1)) {
				const a = all[last].$flap.id, b = all[last + 1].$flap.id;
				const ridge = this._getIntersectionRidge(a, b);
				/* istanbul ignore else: legacy */
				if(ridge) result.end = hingeSideEnd(ridge, all[last]);
			}
		}
		return result;
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Resolve the starting/ending points for a single {@link Quadrant} (see
	 * {@link Quadrant.$resolveStartEnd}).
	 */
	private _resolveQuadrant(
		quadrant: Quadrant, leaves: ReadonlySet<NodeId>
	): StartEnd | null {
		const resolved = quadrant.$resolveStartEnd(leaves);
		if(!resolved) return null;
		const result: StartEnd = {
			start: resolved.start, end: resolved.end,
		};
		if(resolved.startDivision) {
			const ridge = this._getIntersectionRidge(...resolved.startDivision);
			/* istanbul ignore else: legacy */
			if(ridge) {
				result.start = hingeSideEnd(ridge, quadrant);
				result.startRidge = ridge;
			}
		}
		return result;
	}

	protected override _involvesInvalidJunctions(
		inside: ReadonlySet<NodeId>
	): boolean {
		const involves = (id: NodeId): boolean =>
			this.$leaves.has(id) || inside.has(id);
		for(const junction of State.$junctions.values()) {
			if(junction.$valid) continue;
			const { $a: a, $b: b } = junction;
			if(involves(a.id) || involves(b.id)) return true;
		}
		return false;
	}

	private _getIntersectionRidge(a: NodeId, b: NodeId): Ridge {
		if(a > b) [a, b] = [b, a];
		return this.$ridges.find(
			r => r.$division && r.$division[0] == a && r.$division[1] == b
		)!;
	}

	////////////////////////////////////////////////////////////////////////////
	// Debug methods
	////////////////////////////////////////////////////////////////////////////

	/// #if DEBUG
	/* istanbul ignore next: debug */
	public createTestCase(hinges: Path, start: Point, end: Point): string {
		// Note that this does not include the virtual starting diagonal (see
		// StartEnd).
		const simp = (s: object): string => JSON.stringify(s).replace(/"(\w+)":/g, "$1:");
		const ridges = `Line.$parseTest(${simp(this.$ridges)})`;
		const dir = "SlashDirection." + (this.$direction == SlashDirection.FW ? "FW" : "BW");
		const sideDiagonals = `Line.$parseTest<SideDiagonal>(${simp(this.$sideDiagonals)})`;
		return `const trace = new Trace(${ridges}, ${dir}, ${sideDiagonals});\nconst result = trace.$generate(parsePath("${pathToString(hinges)}"), new Point${start.toString()}, new Point${end.toString()});`;
	}
	/// #endif
}

/**
 * Both endpoints of an intersection ridge lie on the same diagonal line, so
 * either of them results in the same filtering of the ridges. But for deciding
 * the initial direction of tracing (see
 * {@link TraceContext._diagonalHitInitialVector}), the endpoint on the side of
 * the hinge matters, which is the one farther along the outward direction of
 * the given {@link Quadrant}.
 */
function hingeSideEnd(ridge: Ridge, quadrant: Quadrant): Point {
	const v = QV[quadrant.q];
	const d1 = ridge.p1.x * v.x + ridge.p1.y * v.y;
	const d2 = ridge.p2.x * v.x + ridge.p2.y * v.y;
	return d1 > d2 ? ridge.p1 : ridge.p2;
}
