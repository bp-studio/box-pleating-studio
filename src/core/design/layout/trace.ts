import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { Rectangle } from "core/math/geometry/rectangle";

import type { SlashDirection } from "shared/types/direction";
import type { RoughContour } from "shared/types/geometry";
import type { Repository } from "./repository";
import type { PatternContour } from "../context";

//=================================================================
/**
 * {@link Trace} is the utility class for generating {@link PatternContour}.
 */
//=================================================================
export class Trace {

	private readonly _ridges: Line[];
	private readonly _direction: SlashDirection;
	private readonly _sideDiagonals: Line[];
	private readonly _rect: Rectangle;

	constructor(repo: Repository) {
		this._ridges = repo.$pattern!.$devices.flatMap(d => d.$ridges);
		this._direction = repo.$direction;
		this._sideDiagonals = repo.$configuration!.$sideDiagonals;
		this._rect = getBoundingBox(this._ridges.concat(this._sideDiagonals));
	}

	public $generate(rough: RoughContour): PatternContour | null {
		const start = rough.startIndices[this._direction];
		if(isNaN(start)) return null;

		// POC
		const path: PatternContour = [];
		const l = rough.outer.length;
		const indices: number[] = [];
		const sideDiagonals = this._sideDiagonals;
		const diagonals = new Set(sideDiagonals);
		for(let i = 0; i < l; i++) {
			const p1 = new Point(rough.outer[(start + i) % l]);
			const p2 = new Point(rough.outer[(start + i + 1) % l]);
			// This checking is valid as the lines in the RoughContour are all AA lines,
			// and it is not possible that a single line get across the pattern bounding box.
			if(!this._rect.$contains(p1) && !this._rect.$contains(p2)) continue;

			const line = new Line(p1, p2);
			for(const d of diagonals) {
				const p = line.$intersection(d);
				if(!p) continue;
				path.push(p.$toIPoint());
				let index = (start + i) % l;
				if(p.eq(line.p1)) index -= 1 / 2;
				indices.push(index);
				diagonals.delete(d);
			}
		}
		if(path.length == 2) {
			if(indices[1] < indices[0]) indices[1] += l;
			if(indices[1] - indices[0] > rough.outer.length / 2) path.reverse();
			return path;
		}
		return null;
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
