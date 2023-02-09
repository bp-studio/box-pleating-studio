import { Task } from "./task";
import { State } from "core/service/state";
import { dist } from "../context/tree";
import { UnionFind } from "shared/data/unionFind/unionFind";
import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { Team } from "../layout/team";
import { foreachPair } from "shared/utils/array";

import type { ITreeNode } from "../context";
import type { Junction } from "../layout/junction";

//=================================================================
/**
 * {@link groupTask} 負責將合法的 {@link Junction} 進行分組。
 */
//=================================================================
export const groupTask = new Task(grouping);

function grouping(): void {
	const validJunctions = getValidJunctions();
	checkAllCovering(validJunctions);

	// 分組演算法主體
	const uncoveredJunctions = validJunctions.filter(j => !j.$isCovered);
	const unionFind = new UnionFind<number>();
	const quadrantMap = new IntDoubleMap<Junction>();
	for(const j of uncoveredJunctions) {
		quadrantMap.set(j.$q1, j.$q2, j);
		unionFind.$union(j.$q1, j.$q2);
	}
	const groups = unionFind.$list();
	const nodes = State.$tree.$nodes;
	for(const group of groups) {
		const junctions: Junction[] = [];
		foreachPair(group, (i, j) => {
			const junction = quadrantMap.get(i, j);
			if(junction) junctions.push(junction);
		});
		State.$teams.add(new Team(junctions, group.map(q => nodes[q >>> 2]!)));
	}
}

/**
 * 檢查覆蓋。這邊並沒有採用太高級的動態演算法，而是每一個回合都全部重新計算，
 * 這個固然可能有改進空間，但此處遠遠不是效能瓶頸所在，所以先不管那麼多。
 */
function checkAllCovering(junctions: Junction[]): void {
	foreachPair(junctions, (j1, j2) => checkCovering(j1, j2));
}

/** 收集所有合法的 {@link Junction}，並且重設它們的覆蓋狀態 */
function getValidJunctions(): Junction[] {
	const result: Junction[] = [];
	for(const j of State.$junctions.values()) {
		if(j.$valid) {
			j.$resetCovering();
			result.push(j);
		}
	}
	return result;
}

/** 檢查兩個 {@link Junction} 之間是否有覆蓋關係 */
function checkCovering(j1: Junction, j2: Junction): void {
	if(j1.$slash !== j2.$slash) return;

	const n = getPathIntersectionDistances(j1, j2);
	if(!n) return;
	const r1 = j1.$getBaseRectangle(n[0]);
	const r2 = j2.$getBaseRectangle(n[1]);

	if(r1.eq(r2)) {
		if(j1.$sx < j2.$sx || j1.$sy < j2.$sy) j2.$setCoveredBy(j1);
		else j1.$setCoveredBy(j2);
	} else if(r1.$contains(r2)) {
		j2.$setCoveredBy(j1);
	} else if(r2.$contains(r1)) {
		j1.$setCoveredBy(j2);
	}
}

/** 找出對應路徑上的一個共用點，並且傳回兩個 {@link Junction.$a} 到該點的距離（基準距離） */
function getPathIntersectionDistances(j1: Junction, j2: Junction): [number, number] | undefined {
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

/** 第一個點是否為第二個點的祖先 */
function isAncestor(p: ITreeNode, n: ITreeNode): boolean {
	while(n.$dist > p.$dist) n = n.$parent!;
	return n === p;
}
