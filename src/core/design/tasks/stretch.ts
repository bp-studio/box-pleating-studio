import { Task } from "./task";
import { State } from "core/service/state";
import { dist } from "../context/tree";
import { ListUnionFind } from "shared/data/unionFind/listUnionFind";
import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { foreachPair } from "shared/utils/array";
import { minComparator } from "shared/data/heap/heap";
import { configurationTask } from "./configuration";
import { Stretch } from "../layout/stretch";

import type { ValidJunction } from "../layout/junction/validJunction";
import type { ITreeNode } from "../context";
import type { Junction } from "../layout/junction/junction";

//=================================================================
/**
 * {@link stretchTask} 負責將合法的 {@link Junction} 進行分組並維護 {@link Stretch} 的集合。
 */
//=================================================================
export const stretchTask = new Task(stretch, configurationTask);

function stretch(): void {
	const validJunctions = getValidJunctions();
	checkAllCovering(validJunctions);

	const uncoveredJunctions = validJunctions.filter(j => !j.$isCovered);
	grouping(uncoveredJunctions);

	for(const signature of State.$stretchDiff.$diff()) {
		if(State.$isDragging) {
			// 放到暫存區當中
			const s = State.$stretches.get(signature)!;
			State.$stretchCache.set(signature, s);
		}
		State.$stretches.delete(signature);
		State.$updateResult.remove.stretches.push(signature);
	}
}

/** 分組演算法的主體 */
function grouping(uncoveredJunctions: ValidJunction[]): void {
	const unionFind = new ListUnionFind<number>(
		// 參與的 Quadrant 的數目最多就是 Junction 數目乘以二
		uncoveredJunctions.length * 2
	);
	const quadrantMap = new IntDoubleMap<ValidJunction>();
	for(const j of uncoveredJunctions) {
		quadrantMap.set(j.$a.id, j.$b.id, j);
		unionFind.$union(j.$q1, j.$q2);
	}
	const groups = unionFind.$list();
	for(const group of groups) {
		const junctions: ValidJunction[] = [];
		const ids = group.map(q => q >>> 2).sort(minComparator);
		foreachPair(ids, (i, j) => {
			const junction = quadrantMap.get(i, j);
			if(junction) junctions.push(junction);
		});

		const signature = ids.join(",");
		State.$stretchDiff.$add(signature);
		const oldStretch = tryGetStretch(signature);
		if(oldStretch) oldStretch.$update(junctions);
		else State.$stretches.set(signature, new Stretch(junctions));
	}
}

/** 根據簽章試著找出既有的 {@link Stretch}（包括暫存的） */
function tryGetStretch(signature: string): Stretch | undefined {
	let result = State.$stretches.get(signature);
	if(!result && State.$isDragging) {
		result = State.$stretchCache.get(signature);
		// 記得要把暫存的物件放回去
		if(result) State.$stretches.set(signature, result);
	}
	return result;
}

/**
 * 檢查覆蓋。這邊並沒有採用太高級的動態演算法，而是每一個回合都全部重新計算，
 * 這個固然可能有改進空間，但此處遠遠不是效能瓶頸所在，所以先不管那麼多。
 */
function checkAllCovering(junctions: ValidJunction[]): void {
	foreachPair(junctions, (j1, j2) => checkCovering(j1, j2));
}

/** 收集所有合法的 {@link Junction}，並且重設它們的覆蓋狀態 */
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

/** 檢查兩個 {@link Junction} 之間是否有覆蓋關係 */
function checkCovering(j1: ValidJunction, j2: ValidJunction): void {
	if(j1.$slash !== j2.$slash) return;

	const n = getPathIntersectionDistances(j1, j2);
	if(!n) return;
	const r1 = j1.$getBaseRectangle(n[0]);
	const r2 = j2.$getBaseRectangle(n[1]);

	if(r1.eq(r2)) {
		// 一樣大的情況中，近的覆蓋遠的
		if(j1.$isCloserThan(j2)) j2.$setCoveredBy(j1);
		else j1.$setCoveredBy(j2);
	} else if(r1.$contains(r2)) {
		j2.$setCoveredBy(j1);
	} else if(r2.$contains(r1)) {
		j1.$setCoveredBy(j2);
	}
}

/** 找出對應路徑上的一個共用點，並且傳回兩個 {@link Junction.$a} 到該點的距離（基準距離） */
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
 * 第一個點是否為第二個點的祖先。
 *
 * 實務上這兩個點並不會在樹上相差太遠，所以這個動作的執行是夠快的。
 */
function isAncestor(p: ITreeNode, n: ITreeNode): boolean {
	while(n.$dist > p.$dist) n = n.$parent!;
	return n === p;
}
