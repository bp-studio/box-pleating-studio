import { balanceTask } from "./balance";
import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link AABBTask} 負責更新 {@link TreeNode.$AABB}。
 */
//=================================================================
export const AABBTask = new Task(process, balanceTask);

function process(): void {
	climb(updater, State.$lengthChanged, State.$AABBChanged, State.$parentChanged);
}

function updater(node: ITreeNode): boolean {
	State.$AABBChanged.add(node);
	if(!node.$parent) return false;
	if(State.$parentChanged.has(node)) {
		node.$AABB.$setMargin(node.$length);
		return node.$parent.$AABB.$addChild(node.$AABB);
	} else {
		return node.$parent.$AABB.$updateChild(node.$AABB);
	}
}
