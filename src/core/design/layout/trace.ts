import { Rectangle } from "core/math/geometry/rectangle";
import { SlashDirection } from "shared/types/direction";
import { TraceContext, getNextIntersection } from "./traceContext";
import { Line } from "core/math/geometry/line";

import type { Point } from "core/math/geometry/point";
import type { Ridge } from "./pattern/device";
import type { SideDiagonal } from "./configuration";
import type { RoughContour } from "shared/types/geometry";
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

	public $generate(rough: RoughContour): PatternContour | null {
		const ctx = new TraceContext(this, rough);
		if(!ctx.$valid) return null;

		const path: Point[] = [];
		const ridges = new Set(this.$ridges);
		const diagonals = new Set(this.$sideDiagonals);

		let cursor = ctx.$findInitialRay(ridges, diagonals);
		if(!cursor) return null;
		path.push(cursor.point);

		for(const diagonal of diagonals) ridges.add(diagonal);

		// Main loop
		while(true) {
			const intersection = getNextIntersection(ridges, cursor);
			if(!intersection) {
				if(ctx.$testEnd(cursor)) break;
				else return null; // Something went wrong. Output nothing.
			}
			if(diagonals.has(intersection.line as SideDiagonal)) {
				const lastLine = new Line(path[path.length - 1], intersection.point);
				const existingCorner = rough.outer.find(p => lastLine.$contains(p));
				if(!existingCorner) path.push(intersection.point);
				break;
			}
			ridges.delete(intersection.line);
			cursor = {
				point: intersection.point,
				vector: intersection.line.$reflect(cursor.vector),
			};
			path.push(cursor.point);

			// The current logic is, when it hits a corner of the rough contour, it should end immediately.
			// This is more an unproven hypothesis.
			if(intersection.endPoint && rough.outer.some(p => intersection.point.eq(p))) break;
		}

		return path.map(p => p.$toIPoint()) as PatternContour;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG==true

	public $createTestCase(roughContour: RoughContour): string {
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
