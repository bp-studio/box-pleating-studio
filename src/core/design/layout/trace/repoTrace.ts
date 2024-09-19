import { pathToString } from "core/math/geometry/path";
import { SlashDirection } from "shared/types/direction";
import { Trace } from "./trace";
import { minQuadrantWeightComparator, startEndPoints } from "../pattern/quadrant";

import type { NodeId } from "shared/json/tree";
import type { Ridge } from "../pattern/device";
import type { Repository } from "../repository";
import type { Point } from "core/math/geometry/point";
import type { Path } from "shared/types/geometry";
import type { Quadrant } from "../pattern/quadrant";

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

	/** Determine the starting/ending point of tracing. */
	public $resolveStartEnd(filtered: Quadrant[], all: Quadrant[]): [Point, Point] {
		let [start, end] = startEndPoints(filtered);
		if(filtered.length != all.length) {
			filtered.sort(minQuadrantWeightComparator);
			const first = all.indexOf(filtered[0]);
			const last = all.indexOf(filtered[filtered.length - 1]);
			if(first > 0) {
				const a = all[first - 1].$flap.id, b = all[first].$flap.id;
				const ridge = this._getIntersectionRidge(a, b);
				// It is possible that the intersection ridge is missing in legacy patterns.
				/* istanbul ignore else: legacy */
				if(ridge) start = ridge.p1;
			}
			if(last < all.length - 1) {
				const a = all[last].$flap.id, b = all[last + 1].$flap.id;
				const ridge = this._getIntersectionRidge(a, b);
				/* istanbul ignore else: legacy */
				if(ridge) end = ridge.p1;
			}
		}
		return [start, end];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _getIntersectionRidge(a: NodeId, b: NodeId): Ridge {
		if(a > b) [a, b] = [b, a];
		return this.$ridges.find(r => r.$division && r.$division[0] == a && r.$division[1] == b)!;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/// #if DEBUG
	/* istanbul ignore next: debug */
	public createTestCase(hinges: Path, start: Point, end: Point): string {
		const simp = (s: object): string => JSON.stringify(s).replace(/"(\w+)":/g, "$1:");
		const ridges = `Line.$parseTest(${simp(this.$ridges)})`;
		const dir = "SlashDirection." + (this.$direction == SlashDirection.FW ? "FW" : "BW");
		const sideDiagonals = `Line.$parseTest<SideDiagonal>(${simp(this.$sideDiagonals)})`;
		return `const trace = new Trace(${ridges}, ${dir}, ${sideDiagonals});\nconst result = trace.$generate(parsePath("${pathToString(hinges)}"), new Point${start.toString()}, new Point${end.toString()});`;
	}
	/// #endif
}
