import { writeFileSync } from "fs";

import { Tree } from "core/design/context/tree";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";
import { State, fullReset } from "core/service/state";
import { Migration } from "client/patches";

import type { TreeNode } from "core/design/context/treeNode";
import type { JEdge, JFlap, NodeId } from "shared/json";

export const id0 = 0 as NodeId;
export const id1 = 1 as NodeId;
export const id2 = 2 as NodeId;
export const id3 = 3 as NodeId;
export const id4 = 4 as NodeId;
export const id6 = 6 as NodeId;

type Substitute<T, T1, T2> = {
	[k in keyof T]: T[k] extends T1 ? T2 : T[k];
};

export type NEdge = Substitute<JEdge, NodeId, number>;
export type NFlap = Substitute<JFlap, NodeId, number>;

/**
 * @param edges Comma-separated list of `(n1,n2,length)`.
 * @param flaps Comma-separated list of `(id,x,y,width,height)`.
 */
export function parseTree(edges: string, flaps: string): Tree {
	const nEdges: NEdge[] = [...edges.matchAll(/\((\d+),(\d+),(\d+)\)/g)]
		.map(m => ({ n1: Number(m[1]), n2: Number(m[2]), length: Number(m[3]) }));
	const nFlaps: NFlap[] = [...flaps.matchAll(/\((\d+),(-?\d+),(-?\d+),(\d+),(\d+)\)/g)]
		.map(m => ({ id: Number(m[1]), x: Number(m[2]), y: Number(m[3]), width: Number(m[4]), height: Number(m[5]) }));
	return createTree(nEdges, nFlaps);
}

/**
 * Export tree to a BPS file `export.bps` for further inspection.
 */
export function exportProject(id: string | number = ""): void {
	const nodes = State.$tree.$nodes.filter(l => l) as TreeNode[];
	const project = Migration.$getSample();
	project.design.mode = "layout";
	const sheet = project.design.layout.sheet;
	for(const flap of nodes.filter(l => l.$isLeaf)) {
		const sides = flap.$AABB.$toValues();
		project.design.layout.flaps.push({
			id: flap.id, x: sides[3], y: sides[2],
			width: sides[1] - sides[3], height: sides[0] - sides[2],
		});
		if(sheet.width < sides[1]) sheet.width = sides[1];
		if(sheet.height < sides[0]) sheet.height = sides[0];
	}
	for(const n of nodes) {
		project.design.tree.nodes.push({ id: n.id, x: 0, y: 0, name: "" });
		if(n.$parent) {
			project.design.tree.edges.push({ n1: n.$parent.id, n2: n.id, length: n.$length });
		}
	}
	writeFileSync(`export${id}.bps`, JSON.stringify(project));
}

export function createTree(edges: NEdge[], flaps?: NFlap[]): Tree {
	fullReset();
	const tree = new Tree(edges as JEdge[], flaps as JFlap[]);
	State.$tree = tree;
	Processor.$run(heightTask);
	return tree;
}

export function node(id: number): TreeNode | undefined {
	return State.$tree.$nodes[id as NodeId];
}
