import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";

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

	constructor(repo: Repository) {
		this._ridges = repo.$pattern!.$devices.flatMap(d => d.$ridges);
		this._direction = repo.$direction;
		this._sideDiagonals = repo.$configuration!.$sideDiagonals;
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
			const line = new Line(
				new Point(rough.outer[(start + i) % l]),
				new Point(rough.outer[(start + i + 1) % l])
			);
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
