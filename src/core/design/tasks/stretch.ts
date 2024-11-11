import { Task } from "./task";
import { State } from "core/service/state";
import { dist } from "../context/treeUtils";
import { ListUnionFind } from "shared/data/unionFind/listUnionFind";
import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { distinct, foreachPair } from "shared/utils/array";
import { minComparator } from "shared/data/heap/heap";
import { patternTask } from "./pattern";
import { Stretch } from "../layout/stretch";
import { clearPatternContourForRepo } from "./patternContour";
import { UpdateResult } from "core/service/updateResult";

import type { JStretch, NodeId } from "shared/json";
import type { Junctions, ValidJunction } from "../layout/junction/validJunction";
import type { ITreeNode } from "../context";
import type { Junction } from "../layout/junction/junction";

/** A group of connected {@link ValidJunction}s */
interface Team {
	$junctions: Junctions;
	$flaps: NodeId[];
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

	for(const id of State.$stretchDiff.$diff()) {
		const s = State.$stretches.get(id)!;
		clearPatternContourForRepo(s.$repo);
		if(State.$isDragging) {
			// Put into cache
			s.$isActive = false;
			State.$stretchCache.set(id, s);
		}
		State.$stretches.delete(id);
		UpdateResult.$removeStretch(id);
	}
}

/** Grouping algorithm */
function grouping(junctions: Junctions): Team[] {
	const unionFind = new ListUnionFind<number>(
		// Involved Junctions are at most Quadrant times 2
		junctions.length * 2
	);
	const quadrantMap = new IntDoubleMap<NodeId, ValidJunction>();
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
		const $flaps = distinct(group.map(q => q >>> 2 as NodeId).sort(minComparator));

		foreachPair($flaps, (i, j) => {
			const junction = quadrantMap.get(i, j);
			if(junction && group.includes(junction.$q1)) $junctions.push(junction);
		});
		result.push({ $junctions, $flaps });
	}
	return result;
}

/** Processes the {@link Team}s resulting from the first round of grouping. */
function processTeam(junctions: Junctions): void {
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
function getUncoveredJunctions(junctions: Junctions): Junctions {
	if(junctions.length === 1) return junctions;
	foreachPair(junctions, (j1, j2) => checkGeometricalCovering(j1, j2));
	return junctions.filter(j => !j.$isCovered);
}

/** Update or create {@link Stretch} based on the flap structure of the {@link Team}. */
function createOrUpdateStretch(team: Team): void {
	const stretchId = team.$flaps.join(",");
	State.$stretchDiff.$add(stretchId);
	const oldStretch = tryGetStretch(stretchId);
	const prototype = State.$stretchPrototypes.get(stretchId) || { id: stretchId };
	if(oldStretch) {
		oldStretch.$update(team.$junctions, prototype);
	} else {
		const stretch = new Stretch(team.$junctions, prototype);
		State.$stretches.set(stretchId, stretch);
	}
}

/** Try to get an existing (including cached) {@link Stretch} by id. */
function tryGetStretch(id: string): Stretch | undefined {
	let result = State.$stretches.get(id);
	if(!result && State.$isDragging) {
		result = State.$stretchCache.get(id);
		// Don't forget to put the cached object back
		if(result) State.$stretches.set(id, result);
	}
	return result;
}

/** Collect all {@link ValidJunction}s and reset their covering states. */
function getValidJunctions(): Junctions {
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
function checkGeometricalCovering(j1: ValidJunction, j2: ValidJunction): void {
	if(j2.$lca.$dist > j1.$lca.$dist) [j1, j2] = [j2, j1];
	const n = getPathIntersectionDistances(j1, j2);
	if(!n) return;
	const r1 = j1.$getBaseRectangle(n[0]);
	const r2 = j2.$getBaseRectangle(n[1]);

	const j1Closer = j1.$isCloserThan(j2);
	if(r1.eq(r2)) {
		// In case of equal junctions, at least one side should be of the same flap
		const [a1, b1] = j1.$orientedIds;
		const [a2, b2] = j2.$orientedIds;
		if(a1 !== a2 && b1 !== b2) return;
		// Then the near one covers the far one.
		if(j1Closer) j2.$setGeometricallyCoveredBy(j1);
		else j1.$setGeometricallyCoveredBy(j2);
	} else if(j1Closer && r1.$contains(r2)) {
		j2.$setGeometricallyCoveredBy(j1);
	} else if(j2.$isCloserThan(j1) && r2.$contains(r1)) {
		j1.$setGeometricallyCoveredBy(j2);
	}
}

/**
 * Find a common node on the two corresponding paths,
 * and return the distance of the two {@link Junction.$a}s to that node
 * (the canonical distances).
 *
 * It is assumed here that `p1.$dist >= p2.$dist`.
 */
function getPathIntersectionDistances(j1: ValidJunction, j2: ValidJunction): [number, number] | undefined {
	const p1 = j1.$lca, p2 = j2.$lca;
	if(p1 === p2) return [j1.$a.$dist - p1.$dist, j2.$a.$dist - p1.$dist];
	if(p1.$dist === p2.$dist) return undefined;
	if(isAncestor(p1, j2.$a)) return [j1.$a.$dist - p1.$dist, j2.$a.$dist - p1.$dist];
	if(isAncestor(p1, j2.$b)) return [j1.$a.$dist - p1.$dist, dist(j2.$a, p1, p2)];
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

export function setStretchPrototypes(prototypes: JStretch[]): void {
	for(const json of prototypes) {
		State.$stretchPrototypes.set(json.id, json);
	}
}
