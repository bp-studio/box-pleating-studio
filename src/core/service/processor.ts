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
		// It would seem that putting State.$resetResult() here will make sense,
		// but the problem is the $updateResult could be written even
		// before the tasks start running, so we cannot actually do that.

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
