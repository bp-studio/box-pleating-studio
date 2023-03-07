import { Task } from "./task";
import { climb } from "./climb";
import { State } from "core/service/state";
import { AAUnion } from "core/math/polyBool/union/aaUnion";
import { expand } from "core/math/polyBool/expansion";
import { graphicsTask } from "./graphics";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link roughContourTask} updates {@link ITreeNode.$outerRoughContour}
 * and {@link ITreeNode.$innerRoughContour}。
 */
//=================================================================
export const roughContourTask = new Task(roughContour, graphicsTask);

const union = new AAUnion();

function roughContour(): void {
	climb(updater,
		State.$flapAABBChanged,
		State.$parentChanged,
		State.$childrenChanged,
		State.$lengthChanged
	);
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) return false;
	if(node.$isLeaf) {
		const path = node.$AABB.$toPath();
		node.$roughContours = [{ outer: path }];
	} else {
		const components = [...node.$children].map(n => n.$roughContours.map(c => c.outer));
		const inner = union.$get(...components);
		node.$roughContours = expand(inner, node.$length);
	}
	State.$contourWillChange.add(node);
	return true;
}
