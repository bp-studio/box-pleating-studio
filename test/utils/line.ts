import { Line } from "core/math/geometry/line";
import { pointToString } from "core/math/geometry/path";
import { same } from "shared/types/geometry";

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
	const m = line.match(/-?\d+/g)!.map(n => Number(n));
	return Line.$fromIPoint({ x: m[0], y: m[1] }, { x: m[2], y: m[3] });
}
