import { HeapSet } from "shared/data/heap/heapSet";
import { State } from "./state";

import type { Task } from "core/design/tasks/task";
import type { Contour, Path, Polygon } from "shared/types/geometry";
import type { JEdge, JEdgeBase } from "shared/json/tree";
import type { GraphicsData, UpdateModel } from "./updateModel";

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

	export function $removeEdge(edge: JEdgeBase): void {
		updateResult.remove.edges.push(edge);
	}

	export function $addNode(id: number): void {
		updateResult.add.nodes.push(id);
	}

	export function $removeNode(id: number): void {
		updateResult.remove.nodes.push(id);
	}

	export function $addGraphics(tag: string, graphics: GraphicsData): void {
		updateResult.graphics[tag] = graphics;
	}

	export function $addJunction(tag: string, path: Polygon): void {
		updateResult.add.junctions[tag] = path;
	}

	export function $removeJunction(tag: string): void {
		updateResult.remove.junctions.push(tag);
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
				junctions: {},
			},
			remove: {
				edges: [],
				nodes: [],
				junctions: [],
			},
			graphics: {},
		};
	}

	reset();
}
