import { SlashDirection } from "shared/types/direction";
import { TraceContext, getNextIntersection } from "./traceContext";
import { pathToString } from "core/math/geometry/path";
import { Line } from "core/math/geometry/line";
import { Vector } from "core/math/geometry/vector";
import { quadrantComparator, startEndPoints } from "../pattern/quadrant";

import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Quadrant } from "../pattern/quadrant";
import type { Point } from "core/math/geometry/point";
import type { Ridge } from "../pattern/device";
import type { SideDiagonal } from "../configuration";
import type { Path } from "shared/types/geometry";
import type { Repository } from "../repository";
import type { PatternContour } from "../../context";

//=================================================================
/**
 * {@link Trace} is the utility class for generating {@link PatternContour}.
 */
//=================================================================
export class Trace {

	public static $fromRepo(repo: Repository): Trace {
		const trace = new Trace(
			repo.$pattern!.$devices.flatMap(d => d.$traceRidges),
			repo.$direction,
			repo.$configuration!.$sideDiagonals
		) as Writeable<Trace>;
		trace.$repo = repo;
		trace.$leaves = new Set(repo.$nodeSet.$leaves);
		return trace as Trace;
	}

	public readonly $repo!: Repository;
	public readonly $leaves!: ReadonlySet<number>;
	public readonly $ridges: readonly Ridge[];
	public readonly $direction: SlashDirection;
	public readonly $sideDiagonals: readonly SideDiagonal[];

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

		// In raw mode, we need to make one extra check to make sure the
		// generated contour actually fits the given hinge segment.
		if(!result) return null;
		const lastPoint = result[result.length - 1];
		for(let i = hinges.length - 1; i > 0; i--) {
			const line = Line.$fromIPoint(hinges[i], hinges[i - 1]);
			if(line.$contains(lastPoint, true)) return result;
		}
		return null;
	}

	/** Determine the starting/ending point of tracing. */
	public $resolveStartEnd(filtered: Quadrant[], all: Quadrant[]): [Point, Point] {
		let [start, end] = startEndPoints(filtered);
		if(filtered.length != all.length) {
			filtered.sort(quadrantComparator);
			const first = all.indexOf(filtered[0]);
			const last = all.indexOf(filtered[filtered.length - 1]);
			if(first > 0) {
				const a = all[first - 1].$flap.id, b = all[first].$flap.id;
				const ridge = this._getIntersectionRidge(a, b);
				// It is possible that the intersection ridge is missing in legacy patterns.
				if(ridge) start = ridge.p1;
			}
			if(last < all.length - 1) {
				const a = all[last].$flap.id, b = all[last + 1].$flap.id;
				const ridge = this._getIntersectionRidge(a, b);
				if(ridge) end = ridge.p1;
			}
		}
		return [start, end];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _getIntersectionRidge(a: number, b: number): Ridge {
		if(a > b) [a, b] = [b, a];
		return this.$ridges.find(r => r.$division && r.$division[0] == a && r.$division[1] == b)!;
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG
	public createTestCase(hinges: Path, start: Point, end: Point): string {
		const simp = (s: object): string => JSON.stringify(s).replace(/"(\w+)":/g, "$1:");
		const ridges = `Line.$parseTest(${simp(this.$ridges)})`;
		const dir = "SlashDirection." + (this.$direction == SlashDirection.FW ? "FW" : "BW");
		const sideDiagonals = `Line.$parseTest<SideDiagonal>(${simp(this.$sideDiagonals)})`;
		return `const trace = new Trace(${ridges}, ${dir}, ${sideDiagonals});\nconst result = trace.$generate(parsePath("${pathToString(hinges)}"), new Point${start.toString()}, new Point${end.toString()});`;
	}
	///#endif
}
