import { Assertion } from "chai";

import { pathToString } from "core/math/geometry/path";
import { same } from "shared/types/geometry";

import type { Path } from "shared/types/geometry";

export function parsePath(s: string): Path {
	const numbers = s.match(/-?\d+(\.\d+)?/g)?.map(d => Number(d)) ?? [];
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

Assertion.addMethod("equalPath", function(pathString: string, circular: boolean = false) {
	this.assert(
		Array.isArray(this._obj),
		"expect #{this} to be an array",
		"expect #{this} to not be an array",
		null
	);
	const path = (this._obj as Path).concat();
	const orgPathString = pathToString(path);

	// Accepts fractions
	pathString = pathString.replace(/(\d+)\/(\d+)/g, (_, $1, $2) => (Number($1) / Number($2)).toString());

	if(circular) {
		const match = pathString.match(/\((-?\d*\.?\d+),(-?\d*\.?\d+)(?:,-?\d*\.?\d+){0,3}\)/)!;
		const point = { x: Number(match[1]), y: Number(match[2]) };
		const rotateResult = rotatePath(path, point);
		this.assert(
			rotateResult,
			"expect #{act} to contain the point #{exp}",
			"expect #{act} to not contain the point #{exp}",
			match[0],
			orgPathString
		);
	}

	this.assert(
		pathToString(path) == pathString,
		"expect #{act} to equal #{exp}",
		"expect #{act} to not equal #{exp}",
		pathString,
		orgPathString
	);
});
