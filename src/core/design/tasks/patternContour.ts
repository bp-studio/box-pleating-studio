import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { MASK } from "../layout/junction/validJunction";
import { comparator } from "../context/treeNode";
import { MutableHeap } from "shared/data/heap/mutableHeap";

import type { TreeNode } from "../context/treeNode";
import type { Repository } from "../layout/repository";
import type { NodeGraphics } from "../context";

//=================================================================
/**
 * {@link patternContourTask} updates {@link NodeGraphics.$patternContours}.
 */
//=================================================================
export const patternContourTask = new Task(patternContour, graphicsTask);

function patternContour(): void {
	// Reset
	for(const node of State.$contourWillChange) {
		node.$graphics.$patternContours = [];
	}

	for(const repo of State.$repoUpdated) {
		processRepo(repo);
	}
}

function processRepo(repo: Repository): void {
	const pattern = repo.$pattern;
	if(!pattern) return;

	poc(repo); // POC

	// const heap = new MutableHeap<TreeNode>(comparator);
	// const coverages = new Map<number, number[]>();
	// const numLeaves = repo.$nodeIds.length;
	// for(const id of repo.$nodeIds) {
	// 	const leaf = State.$tree.$nodes[id]!;
	// 	heap.$insert(leaf);
	// 	coverages.set(id, [id]);
	// }

	// while(!heap.$isEmpty) {
	// 	const node = heap.$pop()!;
	// 	const coverage = coverages.get(node.id)!;
	// 	if(coverage.length == numLeaves) continue;
	// 	const parent = node.$parent!;
	// 	let parentCoverage = coverages.get(parent.id);
	// 	if(!parentCoverage) {
	// 		heap.$insert(parent);
	// 		coverages.set(parent.id, parentCoverage = []);
	// 	}
	// 	parentCoverage.push(...coverage);
	// }

	// const result: Record<number, number[]> = {};
	// for(const [id, arr] of coverages.entries()) result[id] = arr;
	// console.log(repo.$nodeIds, result);
}

function poc(repo: Repository): void {
	for(const quadrant of repo.$quadrants.values()) {
		const node = quadrant.$flap;
		const q = quadrant.q;

		const corner = node.$AABB.$toPath()[q];
		if(q == 0) {
			node.$graphics.$patternContours.push([
				{ x: corner.x, y: corner.y - 1 },
				{ x: corner.x - 1, y: corner.y },
			]);
		}
		if(q == 1) {
			node.$graphics.$patternContours.push([
				{ x: corner.x + 1, y: corner.y },
				{ x: corner.x, y: corner.y - 1 },
			]);
		}
		if(q == 2) {
			node.$graphics.$patternContours.push([
				{ x: corner.x, y: corner.y + 1 },
				{ x: corner.x + 1, y: corner.y },
			]);
		}
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		if(q == 3) {
			node.$graphics.$patternContours.push([
				{ x: corner.x - 1, y: corner.y },
				{ x: corner.x, y: corner.y + 1 },
			]);
		}
	}
}

interface Bundle {
	$node: TreeNode;
	$coverage: TreeNode[];
}
