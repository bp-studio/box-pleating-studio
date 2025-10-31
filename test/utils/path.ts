import { expect } from "@rstest/core";

import { pathToString } from "core/math/geometry/path";
import { same } from "shared/types/geometry";

import type { Path } from "shared/types/geometry";

export function parsePath(s: string): Path {
	const numbers = parseFractions(s).match(/-?\d+(\.\d+)?/g)?.map(d => Number(d)) ?? [];
	const result: Path = [];
	for(let i = 0; i + 1 < numbers.length; i += 2) {
		result.push({ x: numbers[i], y: numbers[i + 1] });
	}
	return result;
}

function rotatePath(path: Path, pt: IPoint): boolean {
	for(let i = 0; i < path.length; i++) {
		if(same(path[0], pt)) return true;
		path.push(path.shift()!);
	}
	return false;
}

declare global {
	namespace Chai {
		interface Assertion {
			equalPath(pathString: string, circular?: boolean): Chai.Assertion;
		}
	}
}

function parseFractions(s: string): string {
	return s.replace(/(\d+)\/(\d+)/g, (_, $1, $2) => (Number($1) / Number($2)).toString());
}

expect.extend({
	equalPath(receive, pathString: string, circular: boolean = false) {
		expect(Array.isArray(receive)).to.be.true;

		const path = (receive as Path).concat();
		const orgPathString = pathToString(path);

		// Accepts fractions
		pathString = parseFractions(pathString);

		if(circular) {
			const match = pathString.match(/\((-?\d*\.?\d+),(-?\d*\.?\d+)(?:,-?\d*\.?\d+){0,3}\)/)!;
			const point = { x: Number(match[1]), y: Number(match[2]) };
			const rotateResult = rotatePath(path, point);
			if(!rotateResult) {
				return {
					message: () => `expect ${receive} to contain the point ${point}`,
					pass: false,
				};
			}
		}

		const pass = pathToString(path) === pathString;
		const message = pass ?
			() => `expect ${orgPathString} to not equal ${pathString}` :
			() => `expect ${orgPathString} to equal ${pathString}`;
		return { pass, message };
	},
});
