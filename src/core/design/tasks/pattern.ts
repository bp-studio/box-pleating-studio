import { State } from "core/service/state";
import { Task } from "./task";
import { patternContourTask } from "./patternContour";

import type { Configuration } from "../layout/configuration";
import type { Pattern } from "../layout/pattern/pattern";

//=================================================================
/**
 * {@link patternTask} find all possible {@link Configuration}s and {@link Pattern}s.
 */
//=================================================================
export const patternTask = new Task(pattern, patternContourTask);

function pattern(): void {
	for(const repo of State.$newRepositories) {
		if(State.$isDragging) repo.$init();
		else repo.$complete();
	}
	for(const repo of State.$repoUpdated) {
		const id = repo.$stretch.$id;
		if(repo.$pattern) {
			State.$updateResult.add.stretches[id] = {
				data: repo.$stretch.toJSON(),
				repo: repo.toJSON(),
			};
			for(const [i, device] of repo.$pattern.$devices.entries()) {
				State.$updateResult.graphics["s" + id + "." + i] = {
					contours: device.$contour,
					ridges: device.$ridges,
					axisParallel: device.$axisParallels,
					forward: repo.$f.x == repo.$f.y,
				};
			}
			for(const n of repo.$nodes) {
				State.$contourWillChange.add(State.$tree.$nodes[n]!);
			}
		} else {
			State.$updateResult.remove.stretches.push(id);
		}
	}

	for(const s of State.$stretches.values()) {
		if(!s.$repo.$pattern) continue;
		for(const id of s.$repo.$nodes) State.$patternDiff.$add(id);

		// Collect patterned quadrants
		for(const q of s.$repo.$quadrants) {
			State.$patternedQuadrants.add(q);
		}
	}

	for(const id of State.$patternDiff.$diff()) {
		State.$contourWillChange.add(State.$tree.$nodes[id]!);
	}
}
