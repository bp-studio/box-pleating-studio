import { Assertion } from "chai";

import { Line } from "core/math/geometry/line";
import { pointToString } from "core/math/geometry/path";
import { same } from "shared/types/geometry";
import { parseFraction } from "core/math/fraction";
import { Point } from "core/math/geometry/point";

import type { CPLine, CreaseType } from "shared/types/cp";
import type { ILine } from "shared/types/geometry";

declare global {
	namespace Chai {
		interface Assertion {
			containLine(line: ILine): Chai.Assertion;
		}
	}
}

Assertion.addMethod("containLine", function(line: ILine) {
	new Assertion(Array.isArray(this._obj)).to.be.true;

	const match = this._obj.find((l: ILine) =>
		same(line[0], l[0]) && same(line[1], l[1]) ||
		same(line[0], l[1]) && same(line[1], l[0])
	);

	this.assert(
		match !== undefined,
		"expect the array to contain #{exp}",
		"expect the array to not contain #{exp}",
		pointToString(line[0]) + "-" + pointToString(line[1])
	);
});

export function parseLine(line: string) {
	const m = line.match(/-?\d+(\/\d+)?/g)!.map(n => n.includes("/") ? parseFraction(n) : Number(n));
	const p1 = new Point(m[0], m[1]);
	const p2 = new Point(m[2], m[3]);
	return new Line(p1, p2);
}

export function makeCPLine(type: CreaseType, x1: number, y1: number, x2: number, y2: number): CPLine {
	return {
		type,
		p1: { x: x1, y: y1 },
		p2: { x: x2, y: y2 },
	};
}
