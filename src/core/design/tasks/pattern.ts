import { State } from "core/service/state";
import { Task } from "./task";
import { traceContourTask } from "./traceContour";
import { UpdateResult } from "core/service/updateResult";

import type { Configuration } from "../layout/configuration";
import type { Pattern } from "../layout/pattern/pattern";

//=================================================================
/**
 * {@link patternTask} find all possible {@link Configuration}s and {@link Pattern}s.
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
		if(!s.$repo.$isValid) continue;

		if(!s.$repo.$pattern) {
			UpdateResult.$setPatternNotFound();
			continue;
		}

		// Collect patterned quadrants
		for(const q of s.$repo.$quadrants.keys()) {
			State.$patternedQuadrants.add(q);
		}
	}
}
