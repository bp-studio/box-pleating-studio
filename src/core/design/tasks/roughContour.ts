import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { Processor } from "core/service/processor";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link roughContourTask} 負責更新 {@link TreeNode.$outerRoughContour}
 * 和 {@link TreeNode.$innerRoughContour}。
 */
//=================================================================
export const roughContourTask = new Task(process);

const union = new AAUnion();

function process(): void {
	climb(updater, State.$flapAABBChanged as Set<TreeNode>, State.$parentChanged as Set<TreeNode>);
}

function updater(node: TreeNode): boolean {
	if(!node.$parent) return false;
	if(node.$isLeaf) {
		const path = node.$AABB.$toPath();
		node.$outerRoughContour = [path];
		Processor.$addGraphics("f" + node.id, {
			flap: node.$toFlap(),
			contours: [{ outer: path }],
		});
	} else {
		const components = [...node.$children].map(n => n.$outerRoughContour);
		const inner = union.$get(...components);
		node.$innerRoughContour = inner;
		const contours = expand(inner, node.$length);
		node.$outerRoughContour = contours.map(c => c.outer);
		Processor.$addGraphics(node.$riverTag, { contours });
	}
	return true;
}
