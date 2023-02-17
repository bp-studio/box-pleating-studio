import { Task } from "./task";
import { State } from "core/service/state";
import { dist } from "../context/tree";
import { ListUnionFind } from "shared/data/unionFind/listUnionFind";
import { getKey, IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { distinct, foreachPair } from "shared/utils/array";
import { minComparator } from "shared/data/heap/heap";
import { patternTask } from "./pattern";
import { Stretch } from "../layout/stretch";

import type { ValidJunction } from "../layout/junction/validJunction";
import type { ITreeNode } from "../context";
import type { Junction } from "../layout/junction/junction";

/** A group of connected {@link ValidJunction}s */
interface Team {
	$junctions: ValidJunction[];
	$flaps: number[];
}

//=================================================================
/**
 * {@link stretchTask} arranges {@link Junction} into groups and maintain the set of {@link Stretch}es.
 *
 * This is one exceptionally complicated part in the theory of general
 * stretch patterns, and even I can't say that I've figured it all out.
 * For several times throughout the years I thought that I've figured it all out,
 * but then came some bizarre edge cases that proved me wrong.
 * Anyway, the algorithm presented here is the accumulation of my understandings
 * so far, which should at least be able to handle vast majority of cases.
 */
//=================================================================
export const stretchTask = new Task(stretches, patternTask);

function stretches(): void {
	const validJunctions = getValidJunctions();

	// First round of grouping, which helps speed up covering checks.
	const teams = grouping(validJunctions);

	for(const team of teams) processTeam(team.$junctions);

	for(const signature of State.$stretchDiff.$diff()) {
		if(State.$isDragging) {
			// Put into cache
			const s = State.$stretches.get(signature)!;
			State.$stretchCache.set(signature, s);
		}
		State.$stretches.delete(signature);
		State.$updateResult.remove.stretches.push(signature);
	}
}

/** Grouping algorithm */
function grouping(junctions: ValidJunction[]): Team[] {
	const unionFind = new ListUnionFind<number>(
		// Involved Junctions are at most Quadrant times 2
		junctions.length * 2
	);
	const quadrantMap = new IntDoubleMap<ValidJunction>();
	for(const j of junctions) {
		quadrantMap.set(j.$a.id, j.$b.id, j);
		unionFind.$union(j.$q1, j.$q2);
	}
	const groups = unionFind.$list();
	const result: Team[] = [];
	for(const group of groups) {
		const $junctions: ValidJunction[] = [];

		// In some really rare cases, a single flap could have two opposite
		// quadrants showing up in the same group, so the ids of the flaps
		// may contain duplicates. We still have to make the check.
		const $flaps = distinct(group.map(q => q >>> 2).sort(minComparator));

		foreachPair($flaps, (i, j) => {
			const junction = quadrantMap.get(i, j);
			if(junction) $junctions.push(junction);
		});
		result.push({ $junctions, $flaps });
	}
	return result;
}

/** Processes the {@link Team}s resulting from the first round of grouping. */
function processTeam(junctions: ValidJunction[]): void {
	// Covering check
	const uncoveredJunctions = getUncoveredJunctions(junctions);
	if(uncoveredJunctions.length === 1) {
		const { $a, $b } = uncoveredJunctions[0];
		createOrUpdateStretch({
			$flaps: [$a.id, $b.id],
			$junctions: uncoveredJunctions,
		});
	} else {
		// Second round of grouping
		const teams = grouping(uncoveredJunctions);
		for(const team of teams) createOrUpdateStretch(team);
	}
}

/**
 * Filter those {@link ValidJunction} that are not covered.
 * Those are the ones that will actually be used for {@link Stretch}es.
 */
function getUncoveredJunctions(junctions: ValidJunction[]): ValidJunction[] {
	if(junctions.length === 1) return junctions;
	const keys = new Set<number>();
	junctions.forEach(j => keys.add(getKey(j.$a.id, j.$b.id)));
	foreachPair(junctions, (j1, j2) => checkCovering(j1, j2, keys));
	return junctions.filter(j => !j.$isCovered);
}

/** Update or create {@link Stretch} based on the flap structure of the {@link Team}. */
function createOrUpdateStretch(team: Team): void {
	const signature = team.$flaps.join(",");
	State.$stretchDiff.$add(signature);
	const oldStretch = tryGetStretch(signature);
	if(oldStretch) {
		oldStretch.$update(team.$junctions);
	} else {
		const prototype = State.$stretchPrototypes.get(signature);
		const stretch = new Stretch(team.$junctions, prototype);
		State.$stretches.set(signature, stretch);
	}
}

/** Try to get an existing (including cached) {@link Stretch} by signature. */
function tryGetStretch(signature: string): Stretch | undefined {
	let result = State.$stretches.get(signature);
	if(!result && State.$isDragging) {
		result = State.$stretchCache.get(signature);
		// Don't forget to put the cached object back
		if(result) State.$stretches.set(signature, result);
	}
	return result;
}

/** Collect all {@link ValidJunction}s and reset their covering states. */
function getValidJunctions(): ValidJunction[] {
	const result: ValidJunction[] = [];
	for(const j of State.$junctions.values()) {
		if(j.$valid) {
			j.$resetCovering();
			result.push(j);
		}
	}
	return result;
}

/** Check if two {@link Junction}s have a covering relation. */
function checkCovering(j1: ValidJunction, j2: ValidJunction, keys: Set<number>): void {
	const n = getPathIntersectionDistances(j1, j2);
	if(!n) return;
	const r1 = j1.$getBaseRectangle(n[0]);
	const r2 = j2.$getBaseRectangle(n[1]);

	if(r1.eq(r2)) {
		// If they are the same size, the near one covers the far one.
		if(j1.$isCloserThan(j2)) j2.$setCoveredBy(j1);
		else j1.$setCoveredBy(j2);
	} else if(r1.$contains(r2)) {
		if(!checkCoveringException(j1, j2, keys)) j2.$setCoveredBy(j1);
	} else if(r2.$contains(r1)) {
		if(!checkCoveringException(j1, j2, keys)) j1.$setCoveredBy(j2);
	}
}

/**
 * This is rare in practice, but still needed for correctness.
 * For two {@link ValidJunction}s that might have a covering relation,
 * if there is again a {@link ValidJunction} between the two flaps on one side,
 * we should not treat that as covering.
 */
function checkCoveringException(j1: ValidJunction, j2: ValidJunction, keys: Set<number>): boolean {
	const [a1, b1] = j1.$orientedIds;
	const [a2, b2] = j2.$orientedIds;
	return a1 !== a2 && keys.has(getKey(a1, a2)) ||
		b1 !== b2 && keys.has(getKey(b1, b2));
}

/**
 * Find a common node on the two corresponding paths,
 * and return the distance of the two {@link Junction.$a}s to that node
 * (the canonical distances).
 */
function getPathIntersectionDistances(j1: ValidJunction, j2: ValidJunction): [number, number] | undefined {
	const a1 = j1.$lca, a2 = j2.$lca;
	if(a1 === a2) return [j1.$a.$dist - a1.$dist, j2.$a.$dist - a1.$dist];
	if(a1.$dist > a2.$dist) {
		if(isAncestor(a1, j2.$a)) return [j1.$a.$dist - a1.$dist, j2.$a.$dist - a1.$dist];
		if(isAncestor(a1, j2.$b)) return [j1.$a.$dist - a1.$dist, dist(j2.$a, a1, a2)];
	} else if(a2.$dist > a1.$dist) {
		if(isAncestor(a2, j1.$a)) return [j1.$a.$dist - a2.$dist, j2.$a.$dist - a2.$dist];
		if(isAncestor(a2, j1.$b)) return [dist(j1.$a, a2, a1), j2.$a.$dist - a2.$dist];
	}
	return undefined;
}

/**
 * Whether the first node is an ancestor of the second node.
 *
 * In practice these two nodes won't be too far apart on the tree,
 * so the process here is fast enough.
 */
function isAncestor(p: ITreeNode, n: ITreeNode): boolean {
	while(n.$dist > p.$dist) n = n.$parent!;
	return n === p;
}
