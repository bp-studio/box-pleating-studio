import { HeapSet } from "shared/data/heap/heapSet";
import { State } from "./state";

import type { Task } from "core/design/tasks/task";

//=================================================================
/**
 * {@link Processor} manages the execution of updating tasks.
 */
//=================================================================

export namespace Processor {

	const taskHeap = new HeapSet<Task>((a, b) => b.$priority - a.$priority);

	export function $run(...tasks: readonly Task[]): void {
		queue(tasks);
		while(!taskHeap.$isEmpty) {
			const task = taskHeap.$pop()!;
			task.$action();
			queue(task.$dependant);
		}
		State.$reset();
	}

	function queue(tasks: readonly Task[]): void {
		for(const task of tasks) taskHeap.$insert(task);
	}
}
