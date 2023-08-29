import { State } from "core/service/state";
import { Task } from "./task";
import { roughContourTask } from "./roughContour";

import type { Configuration } from "../layout/configuration";
import type { Pattern } from "../layout/pattern/pattern";

//=================================================================
/**
 * {@link patternTask} find all possible {@link Configuration}s and {@link Pattern}s.
 */
//=================================================================
export const patternTask = new Task(pattern, roughContourTask);

function pattern(): void {
	for(const repo of State.$newRepositories) {
		if(State.$isDragging) repo.$init();
		else repo.$complete();
	}

	for(const device of State.$movedDevices) device.$updatePosition();

	for(const repo of State.$repoToProcess) {
		const id = repo.$stretch.$id;
		if(repo.$pattern) {
			State.$updateResult.add.stretches[id] = {
				data: repo.$stretch.toJSON(),
				repo: repo.toJSON(),
			};
			for(const n of repo.$nodeSet.$nodes) {
				State.$contourWillChange.add(State.$tree.$nodes[n]!);
			}
		} else {
			State.$updateResult.remove.stretches.push(id);
		}
	}

	for(const s of State.$stretches.values()) {
		if(!s.$repo.$pattern) continue;
		for(const id of s.$repo.$nodeSet.$nodes) State.$patternDiff.$add(id);

		// Collect patterned quadrants
		for(const q of s.$repo.$quadrants.keys()) {
			State.$patternedQuadrants.add(q);
		}
	}

	for(const id of State.$patternDiff.$diff()) {
		const node = State.$tree.$nodes[id];
		// It could be that the node is deleted, or become the root;
		// only if that's not the case will we add it to the set.
		if(node && node.$parent) {
			State.$contourWillChange.add(node);
		}
	}
}
