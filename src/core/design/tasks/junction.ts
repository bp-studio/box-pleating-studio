import { Task } from "./task";
import { State } from "core/service/state";
import { createJunction, Junction } from "../layout/junction/junction";
import { invalidJunctionTask } from "./invalidJunction";
import { stretchTask } from "./stretch";
import { dist } from "../context/tree";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link junctionTask} maintains {@link State.$junctions}.
 *
 * The major breakthrough of this new algorithm is that there's no
 * need to maintain LCA for the entire tree anymore, as LCA will
 * be provided automatically during the course of the algorithm.
 */
//=================================================================
export const junctionTask = new Task(junction, invalidJunctionTask, stretchTask);

function junction(): void {
	// Delete junctions related to deleted nodes or nodes that are no longer leaves
	for(const id of State.$updateResult.remove.nodes) {
		State.$junctions.delete(id);
	}
	for(const node of State.$childrenChanged) {
		if(node.$children.$size > 0) State.$junctions.delete(node.id);
	}

	// Find all overlapping
	getCollisionOfLCA(State.$tree.$root);
}

function getCollisionOfLCA(lca: ITreeNode): void {
	const children = [...lca.$children];
	const l = children.length;
	for(let i = 0; i < l; i++) {
		const a = children[i];
		const distChanged = ancestorChanged(a);
		for(let j = i + 1; j < l; j++) {
			const b = children[j];
			compare(a, b, lca, distChanged || ancestorChanged(b));
		}
		if(State.$subtreeAABBChanged.has(a)) {
			getCollisionOfLCA(getNontrivialDescendant(a));
		}
	}
}

/**
 * Recursively compare two branches under a given LCA.
 * @param distChanged Indicating that the distance have changed along one of the branches,
 * in which case the comparison cannot be skipped and must carry on.
 */
function compare(A: ITreeNode, B: ITreeNode, lca: ITreeNode, distChanged: boolean): void {
	// If both subtrees haven't changed, there's no need to re-compare.
	if(!distChanged && !State.$subtreeAABBChanged.has(A) && !State.$subtreeAABBChanged.has(B)) return;

	// Test for collision
	if(!intersects(A, B, lca)) {
		clearJunctions(A, B);
		return;
	}

	const ctx: NontrivialDescendantContext = { distChanged };
	const a = getNontrivialDescendant(A, ctx);
	const b = getNontrivialDescendant(B, ctx);
	distChanged = ctx.distChanged;

	const n = a.$children.$size;
	const m = b.$children.$size;
	if(n === 0 && m === 0) {
		// Since a and b are the only descendants of A and B, respectively,
		// A intersecting B must imply that a intersects b.
		// If that is not the case, the rest of the algorithm can go very wrong.
		// Uncomment the next line to debug this.
		// if(!intersects(a, b, lca)) debugger;

		// Leaves found; add it to the output
		State.$junctions.set(a.id, b.id, createJunction(a, b, lca));
	} else {
		// Choose the one with fewer children, to minimize comparisons.
		if(m === 0 || n !== 0 && n < m) {
			for(const c of a.$children) compare(c, b, lca, distChanged || ancestorChanged(c));
		} else {
			for(const c of b.$children) compare(a, c, lca, distChanged || ancestorChanged(c));
		}
	}
}

interface NontrivialDescendantContext {
	distChanged: boolean;
}

function intersects(a: ITreeNode, b: ITreeNode, lca: ITreeNode): boolean {
	return a.$AABB.$intersects(b.$AABB, dist(a, b, lca));
}

function getNontrivialDescendant(node: ITreeNode, ctx?: NontrivialDescendantContext): ITreeNode {
	while(node.$children.$size === 1) {
		node = node.$children.$get()!;
		if(ctx) ctx.distChanged ||= ancestorChanged(node);
	}
	return node;
}

/** Clear all {@link Junction} between leaves under the two given nodes. */
function clearJunctions(a: ITreeNode, b: ITreeNode): void {
	for(const aLeaf of a.$leaves) {
		for(const bLeaf of b.$leaves) {
			State.$junctions.delete(aLeaf.id, bLeaf.id);
		}
	}
}

function ancestorChanged(n: ITreeNode): boolean {
	return State.$lengthChanged.has(n) || State.$parentChanged.has(n);
}
