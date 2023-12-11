import { Fraction } from "core/math/fraction";
import { Point } from "core/math/geometry/point";

import type { RationalPath } from "core/math/geometry/rationalPath";

export function parseRationalPath(s: string): RationalPath {
	const numbers = [...s.matchAll(/(-?\d+)(?:\/(\d+))?/g)]
		.map(m => new Fraction(Number(m[1]), Number(m[2] ?? 1) as Positive));
	const result: RationalPath = [];
	for(let i = 0; i + 1 < numbers.length; i += 2) {
		result.push(new Point(numbers[i], numbers[i + 1]));
	}
	return result;
}
