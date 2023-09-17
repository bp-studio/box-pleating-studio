import { mapDirections } from "core/math/geometry/path";

import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection, SlashDirection } from "shared/types/direction";
import type { Path } from "shared/types/geometry";

export interface HingeSegment extends Path {
	readonly q: QuadrantDirection;
}

/**
 * Break a hinge contour into segments by the given {@link SlashDirection}.
 */
export function createHingeSegments(hinges: Path, dir: SlashDirection): HingeSegment[] {
	const l = hinges.length;
	const directions = mapDirections(hinges);
	const results: HingeSegment[] = [];

	// First find a safe starting index
	const start = directions.findIndex(d => d % 2 != dir);

	// Main loop
	let currentSegment: HingeSegment | undefined;
	for(let i = 0; i < l; i++) {
		const index = (start + i) % l;
		const p = hinges[index];
		if(currentSegment) {
			currentSegment.push(p);
			if(directions[index] != currentSegment.q) {
				results.push(currentSegment);
				currentSegment = undefined;
			}
		}
		if(!currentSegment) {
			const nextDir = directions[(start + i + 1) % l];
			if(nextDir % 2 == dir) {
				currentSegment = [p] as HingeSegment;
				(currentSegment as Writeable<HingeSegment>).q = nextDir;
			}
		}
	}

	// Edge case
	if(currentSegment) {
		currentSegment.push(hinges[start]);
		results.push(currentSegment);
	}
	return results;
}

/**
 * In some really tight layout, it could happen that the rough hinges
 * fail display the twists of rivers. We need to check and modify the
 * output result here if necessary.
 */
export function tryModifySegments(segment: HingeSegment, node: ITreeNode): void {
	// const l = segment.length;

	// //POC
	// // if(segment.q != 2) return;
	// if(node.id == 3 && segment[0].y == 24 || node.id == 8 && segment[0].y == 26) {
	// 	console.log(segment);
	// 	shiftSegment(segment, true, { x: 0, y: 1 });
	// }
}

function shiftSegment(segment: HingeSegment, head: boolean, by: IPoint): void {
	const index = head ? 0 : segment.length - 2;
	segment[index] = shift(segment[index], by);
	segment[index + 1] = shift(segment[index + 1], by);
}

function shift(pt: IPoint, by: IPoint): IPoint {
	return { x: pt.x + by.x, y: pt.y + by.y };
}
