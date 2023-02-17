import { State } from "core/service/state";
import { Task } from "./task";

import type { Stretch } from "../layout/stretch";
import type { Repository } from "../layout/repository";

//=================================================================
/**
 * {@link cleanupTask} clears the cached {@link Stretch}es and {@link Repository Repositories}
 * after dragging, and finish searching for remaining patterns.
 */
//=================================================================
export const cleanupTask = new Task(cleanup);

function cleanup(): void {
	State.$stretchCache.clear();
	for(const stretch of State.$stretches.values()) stretch.$cleanup();
}
