import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { Task } from "./task";
import { distanceTask } from "./distance";
import { AABBTask } from "./aabb";
import { State } from "core/service/state";

import type { ITreeNode } from "../context";

export const collisionTask = new Task(process, distanceTask, AABBTask);

/**
 * 重疊偵測演算法。
 */
function process(): void {
	if(State.$collisions.size > 0) {
		for(const node of State.$AABBChanged) {
			if(node.$isLeaf) State.$collisions.delete(node.id);
		}
	}
	getCollisionOfLCA(State.$tree.$root);
}

function* getNontrivialChildren(node: ITreeNode): IterableIterator<ITreeNode> {
	for(let child of node.$children) {
		while(child.$children.$size === 1) {
			child = child.$children.$get()!;
		}
		yield child;
	}
}

function getCollisionOfLCA(lca: ITreeNode): void {
	const children = [...getNontrivialChildren(lca)];
	const l = children.length;
	for(let i = 0; i < l; i++) {
		const a = children[i];
		for(let j = i + 1; j < l; j++) compare(a, children[j], lca);
		if(State.$AABBChanged.has(a)) getCollisionOfLCA(a);
	}
}

function compare(a: ITreeNode, b: ITreeNode, lca: ITreeNode): void {
	if(!State.$AABBChanged.has(a) && !State.$AABBChanged.has(b)) return;
	const dist = a.$dist + b.$dist - 2 * lca.$dist;
	if(!a.$AABB.$intersects(b.$AABB, dist)) return;

	const n = a.$children.$size;
	const m = b.$children.$size;
	if(n === 0 && m === 0) {
		State.$collisions.set(a.id, b.id, dist);
	} else if(m === 0 || n !== 0 && n < m) {
		for(const c of getNontrivialChildren(a)) compare(c, b, lca);
	} else {
		for(const c of getNontrivialChildren(b)) compare(c, a, lca);
	}
}
