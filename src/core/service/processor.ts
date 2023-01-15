import type { Contour } from "shared/types/geometry";
import type { JEdge } from "shared/json/tree";
import type { UpdateModel } from "./updateModel";

namespace Processor {

	let updateResult: UpdateModel;

	export function $addEdge(edge: JEdge): void {
		updateResult.add.edges.push(edge);
	}

	export function $addNode(id: number): void {
		updateResult.add.nodes.push(id);
	}

	export function $addContour(tag: string, contours: Contour[]): void {
		updateResult.graphics[tag] = { contours };
	}

	export function $reset(): void {
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

	export function $getResult(): UpdateModel {
		return updateResult;
	}
}

export default Processor;
