import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { roughContourTask } from "./roughContour";
import { collisionTask } from "./collision";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link AABBTask} 負責更新 {@link TreeNode.$AABB}。
 */
//=================================================================
export const AABBTask = new Task(process, collisionTask, roughContourTask);

function process(): void {
	climb(updater, State.$lengthChanged, State.$flapAABBChanged, State.$parentChanged);
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) return false;
	State.$subtreeAABBChanged.add(node);

	let result: boolean;
	if(State.$parentChanged.has(node)) {
		node.$AABB.$setMargin(node.$length);
		result = node.$parent.$AABB.$addChild(node.$AABB);
	} else {
		result = node.$parent.$AABB.$updateChild(node.$AABB);
	}

	if(!result) {
		// 如果父點不用繼續更新，記得把祖先都加入 $SubtreeAABBChanged
		while(node.$parent) {
			State.$subtreeAABBChanged.add(node.$parent);
			node = node.$parent;
		}
	}
	return result;
}
