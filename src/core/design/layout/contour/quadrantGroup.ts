import { State } from "core/service/state";
import { AAUnion } from "core/math/sweepLine/polyBool";
import { makeQuadrantCode, quadrantNumber } from "shared/types/direction";
import { debugAssert } from "core/utils/debug";
import { createQuadrantPieces, createRawPieces } from "./rawPiece";

import type { NodeId } from "shared/json/tree";
import type { QuadrantCode, QuadrantDirection } from "shared/types/direction";
import type { PathEx } from "shared/types/geometry";
import type { ValidJunction } from "../../layout/junction/validJunction";
import type { ITreeNode } from "../../context";
import type { RawPiece } from "./rawPiece";
import type { LeafSet } from "./leafGroup";

/** A raw contour created by {@link createQuadrantGroups}. */
export interface QuadrantGroup {
	readonly outers: PathEx[];
	readonly leaves: NodeId[];
	readonly pieces: RawPiece[];
	/** See {@link RawPiece.quadrants}. */
	readonly quadrants: ReadonlySet<QuadrantCode>;
}

interface Context {
	readonly node: ITreeNode;
	/** The covered junctions of each leaf (see {@link createRawPieces}). */
	readonly covered: ReadonlyMap<NodeId, readonly ValidJunction[]>;
	/** The leaves shared by more than one {@link LeafSet}. */
	readonly shared: ReadonlySet<NodeId>;
}

const aaUnion = new AAUnion();

/**
 * Create the raw contours for the {@link LeafSet}s sharing leaves.
 *
 * Each LeafSet must be traced on the same piece, or the tracing of its repo
 * will be broken. On the other hand, a shared leaf cannot be in more than one
 * piece as a whole, or the piece of one repo will fill in the region cut off
 * by the pattern contours of another repo when taking the union. However,
 * different repos involve different quadrants of a shared leaf (as the flaps
 * facing the same quadrant are collected into the same repo), and the pattern
 * contours of a quadrant modify the quadrant only. So we split each shared leaf
 * by its quadrants (see {@link createQuadrantPieces}), and each LeafSet takes
 * the quadrants it involves, while the quadrants not involved by any of them
 * form another piece.
 *
 * Note that the missing corners are always exposed in the resulting pieces
 * (unless carved out by the leaves themselves), as the flaps involved in the
 * same repo never eat the corners of each other in valid layouts.
 */
export function createQuadrantGroups(
	node: ITreeNode, leafSets: readonly LeafSet[],
	covered: ReadonlyMap<NodeId, readonly ValidJunction[]>
): QuadrantGroup[] {
	const overlapping = leafSets.filter(s => s.hasOverlapping);
	const shared = getSharedLeaves(overlapping);
	const ctx: Context = { node, covered, shared };
	const owned = getOwnedQuadrants(node, overlapping, shared);

	const result: QuadrantGroup[] = [];
	for(const leafSet of overlapping) {
		result.push(createGroup(ctx, leafSet, owned.get(leafSet)!));
	}

	// The remaining quadrants of the shared leaves
	const ownedCodes = new Set([...owned.values()].flatMap(s => [...s]));
	for(const id of ctx.shared) {
		const codes = quadrantCodes(id, code => !ownedCodes.has(code));
		if(!codes.size) continue;
		const pieces = createPieces(ctx, id, codes);
		result.push({
			outers: union(pieces), leaves: [id], pieces, quadrants: codes,
		});
	}
	return result;
}

function getSharedLeaves(leafSets: readonly LeafSet[]): Set<NodeId> {
	const found = new Set<NodeId>();
	const result = new Set<NodeId>();
	for(const id of leafSets.flatMap(s => s)) {
		if(found.has(id)) result.add(id);
		found.add(id);
	}
	return result;
}

/** The quadrants of the shared leaves, by the LeafSets involving them. */
function getOwnedQuadrants(
	node: ITreeNode, leafSets: readonly LeafSet[], shared: ReadonlySet<NodeId>
): Map<LeafSet, Set<QuadrantCode>> {
	const result = new Map<LeafSet, Set<QuadrantCode>>();
	const ownedCodes = new Set<QuadrantCode>();
	for(const leafSet of leafSets) {
		const codes = new Set<QuadrantCode>();
		for(const q of leafSet.nodeSet.$quadrantCoverage.get(node) ?? []) {
			if(!shared.has(q.$flap.id)) continue;
			const code = makeQuadrantCode(q.$flap.id, q.q);
			debugAssert(() => !ownedCodes.has(code), "Quadrant in two repos");
			codes.add(code);
			ownedCodes.add(code);
		}
		result.set(leafSet, codes);
	}
	return result;
}

function createGroup(
	ctx: Context, leafSet: LeafSet, codes: ReadonlySet<QuadrantCode>
): QuadrantGroup {
	const tree = State.m.$tree;
	const pieces = leafSet.flatMap(id => ctx.shared.has(id) ?
		createPieces(ctx, id, codes) :
		createRawPieces(ctx.node, tree.$nodes[id]!, ctx.covered.get(id) ?? [])
	);

	// The quadrants of the shared leaves not involved are excluded.
	const quadrants = new Set(leafSet.flatMap(id => [
		...quadrantCodes(id, code => !ctx.shared.has(id) || codes.has(code)),
	]));
	return { outers: union(pieces), leaves: leafSet, pieces, quadrants };
}

function createPieces(
	ctx: Context, id: NodeId, codes: ReadonlySet<QuadrantCode>
): RawPiece[] {
	const leaf = State.m.$tree.$nodes[id]!;
	const quadrants: QuadrantDirection[] = [];
	for(let q = 0 as QuadrantDirection; q < quadrantNumber; q++) {
		if(codes.has(makeQuadrantCode(id, q))) quadrants.push(q);
	}
	const covered = ctx.covered.get(id) ?? [];
	return createQuadrantPieces(ctx.node, leaf, covered, quadrants);
}

function quadrantCodes(
	id: NodeId, predicate: (code: QuadrantCode) => boolean
): Set<QuadrantCode> {
	const result = new Set<QuadrantCode>();
	for(let q = 0 as QuadrantDirection; q < quadrantNumber; q++) {
		const code = makeQuadrantCode(id, q);
		if(predicate(code)) result.add(code);
	}
	return result;
}

function union(pieces: RawPiece[]): PathEx[] {
	return pieces.length > 1 ? aaUnion.$get(...pieces.map(p => [p])) : pieces;
}
