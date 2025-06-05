import { mapDirections } from "core/math/geometry/path";

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
