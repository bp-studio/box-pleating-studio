import { HeapSet } from "shared/data/heap/heapSet";
import { State } from "./state";

import type { Task } from "core/design/tasks/task";
import type { Contour } from "shared/types/geometry";
import type { JEdge } from "shared/json/tree";
import type { UpdateModel } from "./updateModel";

//=================================================================
/**
 * {@link Processor} 負責管理更新作業的運行，以及收集更新的結果。
 */
//=================================================================

export namespace Processor {

	let updateResult: UpdateModel;

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

	export function $addEdge(edge: JEdge): void {
		updateResult.add.edges.push(edge);
	}

	export function $addNode(id: number): void {
		updateResult.add.nodes.push(id);
	}

	export function $addContour(tag: string, contours: Contour[]): void {
		updateResult.graphics[tag] = { contours };
	}

	export function $getResult(): UpdateModel {
		const result = updateResult;
		reset();
		return result;
	}

	function queue(tasks: readonly Task[]): void {
		for(const task of tasks) taskHeap.$insert(task);
	}

	function reset(): void {
		updateResult = {
			add: {
				edges: [],
				nodes: [],
			},
			remove: {
				edges: [],
				nodes: [],
			},
			graphics: {},
		};
	}

	reset();
}
