import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { AABBTask } from "./aabb";
import { Processor } from "core/service/processor";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";
import { distanceTask } from "./distance";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link RoughContourTask} 負責更新 {@link TreeNode.$outerRoughContour} 和 {@link TreeNode.$innerRoughContour}。
 */
//=================================================================
export const RoughContourTask = new Task(process, AABBTask, distanceTask);

const union = new AAUnion();

function process(): void {
	climb(updater, State.$AABBChanged as Set<TreeNode>);
}

function updater(node: TreeNode): boolean {
	if(!node.$parent) return false;
	if(node.$isLeaf) {
		const path = node.$AABB.$toPath();
		node.$outerRoughContour = [path];
		Processor.$addContour("f" + node.id, [{ outer: path }]);
	} else {
		const components = [...node.$children].map(n => n.$outerRoughContour);
		const inner = union.$get(...components);
		node.$innerRoughContour = inner;
		const contours = expand(inner, node.$length);
		node.$outerRoughContour = contours.map(c => c.outer);
		Processor.$addContour(node.$riverTag, contours);
	}
	return true;
}
