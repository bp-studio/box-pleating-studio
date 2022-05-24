import type { Contour } from "shared/types/geometry";
import type { JEdge } from "shared/json/tree";
import type { UpdateModel } from "./updateModel";

namespace Processor {

	let currentProcess: Action | null;

	let updateResult: UpdateModel;

	export function registerTask(action: Action): void {
		currentProcess = action;
	}

	// eslint-disable-next-line require-await
	export async function $runTask(): Promise<UpdateModel | null> {
		if(!currentProcess) return null;

		resetUpdateResult();
		currentProcess();
		currentProcess = null;
		return updateResult;
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

	function resetUpdateResult(): void {
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
}

export default Processor;
