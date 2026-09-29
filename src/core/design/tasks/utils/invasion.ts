import { getOrSetEmptyArray } from "shared/utils/map";

import type { NodeId } from "shared/json/tree";
import type { QuadrantCode } from "shared/types/direction";
import type { ITreeNode } from "../../context";
import type { Junctions } from "../../layout/junction/validJunction";

/** An invader of a leaf (see {@link ValidJunction.$invasion}). */
interface Invader {
	readonly flap: ITreeNode;
	/** The {@link QuadrantCode} of the invaded leaf towards the invader. */
	readonly code: QuadrantCode;
}

/** Maps each invaded leaf to its invaders. */
const invasionMap = new Map<NodeId, Invader[]>();

/**
 * The quadrants (as {@link QuadrantCode}s) carved in the rough contours, updated by {@link roughContourTask}.
 * This persists across rounds, as the graphics could be updated without the rough contours being recalculated.
 */
const carvedQuadrants = new Set<QuadrantCode>();

/** Update {@link carvedQuadrants}. */
export function setCarvedQuadrants(codes: Iterable<QuadrantCode>): void {
	carvedQuadrants.clear();
	for(const code of codes) carvedQuadrants.add(code);
}

/** Whether the given quadrant is carved in the rough contours (see {@link ValidJunction.$invasion}). */
export function isCarvedQuadrant(code: QuadrantCode): boolean {
	return carvedQuadrants.has(code);
}

/** Rebuild {@link invasionMap} from the given valid junctions. */
export function updateInvasionMap(junctions: Junctions): void {
	invasionMap.clear();
	for(const junction of junctions) {
		const invasion = junction.$invasion;
		if(!invasion) continue;
		const isA = junction.$a === invasion.flap;
		getOrSetEmptyArray(invasionMap, invasion.flap.id).push({
			flap: isA ? junction.$b : junction.$a,
			code: isA ? junction.$q1 : junction.$q2,
		});
	}
}

/**
 * Find the quadrants (as {@link QuadrantCode}s) of the leaves under the given node
 * that are carved by invasions (see {@link ValidJunction.$invasion}) of flaps also under the node.
 * If any of the invaders is outside the node, the quadrant is not considered carved here.
 */
export function getCarvedQuadrants(node: ITreeNode): Set<QuadrantCode> {
	const result = new Set<QuadrantCode>();
	const external = new Set<QuadrantCode>();
	const leaves = new Set(node.$leaves.map(l => l.id));
	for(const leaf of node.$leaves) {
		const invaders = invasionMap.get(leaf.id);
		if(!invaders) continue;
		for(const { flap, code } of invaders) {
			(leaves.has(flap.id) ? result : external).add(code);
		}
	}
	for(const code of external) result.delete(code);
	return result;
}

/**
 * Get the invaders (see {@link ValidJunction.$invasion}) of the leaf that are under the given node.
 */
export function getInnerInvaders(node: ITreeNode, leaf: ITreeNode): ITreeNode[] {
	const invaders = invasionMap.get(leaf.id);
	if(!invaders) return [];
	const result: ITreeNode[] = [];
	for(const { flap } of invaders) {
		let n: ITreeNode | undefined = flap;
		while(n && n.$dist > node.$dist) n = n.$parent;
		if(n === node) result.push(flap);
	}
	return result;
}
