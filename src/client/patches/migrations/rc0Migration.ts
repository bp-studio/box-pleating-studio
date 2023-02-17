import { CornerType } from "shared/json";

import type { JConfiguration, JCorner, JProject, JOverlap, JStretch, JLayout } from "shared/json";

/** Since version rc0 it is required that {@link JIntersection} must have `e`. */
export default function $process(proj: Pseudo<JProject>): boolean {
	const st = (proj.layout as JLayout)?.stretches as Pseudo<JStretch>[];
	if(st) {
		for(const s of st.concat()) {
			const cf = s.configuration as Pseudo<JConfiguration>;
			if(cf && (!cf.overlaps || (cf.overlaps as JOverlap[]).some(overlapFilter))) {
				st.splice(st.indexOf(s), 1);
				return true;
			}
		}
	}
	return false;
}

function overlapFilter(o: JOverlap): boolean {
	return o.c.some(
		(c: JCorner) => c.type == CornerType.$intersection && c.e === undefined
	);
}
