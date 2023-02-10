import { State } from "core/service/state";
import { Task } from "./task";

import type { Stretch } from "../layout/stretch";
import type { Repository } from "../layout/repository";

//=================================================================
/**
 * {@link cleanupTask} 負責在拖曳完成之後清理暫存的 {@link Stretch} 和 {@link Repository}，
 * 並且計算剩下的伸展模式。
 */
//=================================================================
export const cleanupTask = new Task(cleanup);

function cleanup(): void {
	State.$stretchCache.clear();
	for(const stretch of State.$stretches.values()) stretch.$cleanup();
}
