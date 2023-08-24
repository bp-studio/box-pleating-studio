import { Rectangle } from "core/math/geometry/rectangle";
import { SlashDirection } from "shared/types/direction";
import { TraceContext, getNextIntersection } from "./traceContext";

import type { Point } from "core/math/geometry/point";
import type { Line } from "core/math/geometry/line";
import type { Ridge } from "./pattern/device";
import type { SideDiagonal } from "./configuration";
import type { Contour, Path } from "shared/types/geometry";
import type { Repository } from "./repository";
import type { PatternContour } from "../context";

//=================================================================
/**
 * {@link Trace} is the utility class for generating {@link PatternContour}.
 */
//=================================================================
export class Trace {

	public static $fromRepo(repo: Repository): Trace {
		return new Trace(
			repo.$pattern!.$devices.flatMap(d => d.$traceRidges),
			repo.$direction,
			repo.$configuration!.$sideDiagonals
		);
	}

	public readonly $ridges: readonly Ridge[];
	public readonly $direction: SlashDirection;
	public readonly $sideDiagonals: readonly SideDiagonal[];
	public readonly $boundingBox: Rectangle;

	constructor(ridges: readonly Ridge[], dir: SlashDirection, sideDiagonals: readonly SideDiagonal[]) {
		this.$ridges = ridges;
		this.$direction = dir;
		this.$boundingBox = getBoundingBox(this.$ridges.concat(sideDiagonals));
		this.$sideDiagonals = sideDiagonals.filter(d => !d.$isDegenerated);
	}

	public $generate(hinges: Path): PatternContour[] {
		const result: PatternContour[] = [];
		const ctx = new TraceContext(this, hinges);
		if(!ctx.$valid) return result;

		while(true) {
			const contour = this._trace(ctx);
			if(!contour) break;
			result.push(contour);
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private method
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _trace(ctx: TraceContext): PatternContour | null {
		const path: Point[] = [];
		const ridges = new Set(this.$ridges);
		const diagonals = new Set(this.$sideDiagonals);

		let cursor = ctx.$getInitialNode(ridges, diagonals);
		if(!cursor) return null;
		path.push(cursor.point);

		for(const diagonal of diagonals) ridges.add(diagonal);

		// Main loop
		while(true) {
			const intersection = getNextIntersection(ridges, cursor);
			if(!intersection) {
				ctx.$markEnd(cursor.point);
				break;
			}

			ridges.delete(intersection.line);
			cursor = {
				last: intersection.line.$vector,
				point: intersection.point,
				vector: intersection.line.$reflect(cursor.vector),
			};
			if(!path[path.length - 1].eq(cursor.point)) path.push(cursor.point);
			if(cursor.vector.$isAxisParallel) {
				const next = getNextIntersection(ridges, cursor);
				if(next && next.point.eq(cursor.point)) continue;
				if(ctx.$testEnd(cursor)) break;
			}
		}

		if(path.length == 1) return null; // Doesn't count
		return path.map(p => p.$toIPoint()) as PatternContour;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG==true

	public $createTestCase(roughContour: Contour): string {
		const simp = (s: object): string => JSON.stringify(s).replace(/"(\w+)":/g, "$1:");
		const ridges = `Line.$parseTest(${simp(this.$ridges)})`;
		const dir = "SlashDirection." + (this.$direction == SlashDirection.FW ? "FW" : "BW");
		const sideDiagonals = `Line.$parseTest<SideDiagonal>(${simp(this.$sideDiagonals)})`;
		const rough = simp(roughContour);
		return `const trace = new Trace(${ridges}, ${dir}, ${sideDiagonals});\nconst result = trace.$generate(${rough});`;
	}

	///#endif
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
