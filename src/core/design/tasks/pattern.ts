import { State } from "core/service/state";
import { Task } from "./task";
import { traceContourTask } from "./traceContour";
import { UpdateResult } from "core/service/updateResult";

import type { Configuration } from "../layout/configuration";
import type { Pattern } from "../layout/pattern/pattern";
import type { NodeId } from "shared/json/tree";

//=================================================================
/**
 * {@link patternTask} find all possible {@link Configuration}s and
 * {@link Pattern}s.
 */
//=================================================================
export const patternTask = new Task(pattern, traceContourTask);

function pattern(): void {
	for(const repo of State.$newRepositories) repo.$init();

	for(const device of State.$movedDevices) device.$updatePosition();

	for(const repo of State.$repoToProcess) {
		const id = repo.$stretch.$id;
		if(repo.$pattern) {
			UpdateResult.$addStretch(id, repo.$stretch.toJSON());
		} else {
			UpdateResult.$removeStretch(id);
		}
	}

	for(const s of State.$stretches.values()) {
		if(!s.$repo.$pattern) {
			// Notify the user, unless some of the flaps involved form invalid
			// junctions (in which case the layout itself is invalid, and that
			// is already signified). Note that this includes the repos skipped
			// by the validity checks (see Repository.$isValid), as those are
			// also stretches without patterns from the user's point of view.
			if(!hasInvalidJunction(s.$repo.$nodeSet.$leaves)) {
				UpdateResult.$setPatternNotFound();
			}
			continue;
		}

		// Collect patterned quadrants
		for(const q of s.$repo.$quadrants.keys()) {
			State.$patternedQuadrants.add(q);
		}
	}
}

/** Whether any two of the given flaps form an invalid junction. */
function hasInvalidJunction(flaps: readonly NodeId[]): boolean {
	for(let i = 0; i < flaps.length; i++) {
		for(let j = i + 1; j < flaps.length; j++) {
			const junction = State.$junctions.get(flaps[i], flaps[j]);
			if(junction && !junction.$valid) return true;
		}
	}
	return false;
}
