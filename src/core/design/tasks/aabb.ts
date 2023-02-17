import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { roughContourTask } from "./roughContour";
import { junctionTask } from "./junction";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link AABBTask} updates {@link TreeNode.$AABB}。
 */
//=================================================================
export const AABBTask = new Task(aabb, junctionTask, roughContourTask);

function aabb(): void {
	climb(updater, State.$lengthChanged, State.$flapAABBChanged, State.$parentChanged);
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) return false;
	State.$subtreeAABBChanged.add(node);
	if(node.$isLeaf) State.$flapChanged.add(node);

	let result: boolean;
	if(State.$parentChanged.has(node)) {
		node.$AABB.$setMargin(node.$length);
		result = node.$parent.$AABB.$addChild(node.$AABB);
	} else {
		result = node.$parent.$AABB.$updateChild(node.$AABB);
	}

	if(!result) {
		// If there's no need to further update the parent,
		// make sure that we add all ancestors to $subtreeAABBChanged
		while(node.$parent) {
			State.$subtreeAABBChanged.add(node.$parent);
			node = node.$parent;
		}
	}
	return result;
}
