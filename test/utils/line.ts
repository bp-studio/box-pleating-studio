import { expect } from "@rstest/core";

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

expect.extend({
	containLine(received, line: ILine) {
		expect(Array.isArray(received)).to.be.true;

		const match = received.find((l: ILine) =>
			same(line[0], l[0]) && same(line[1], l[1]) ||
			same(line[0], l[1]) && same(line[1], l[0])
		);

		const lineString = pointToString(line[0]) + "-" + pointToString(line[1]);
		return {
			pass: match !== undefined,
			message: () => match ?
				`expect the array to not contain ${lineString}` :
				`expect the array to contain ${lineString}`,
		};
	},
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
