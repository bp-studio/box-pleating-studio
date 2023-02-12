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

/** 一些彼此相連的 {@link ValidJunction} 所構成的群組 */
interface Team {
	$junctions: ValidJunction[];
	$flaps: number[];
}

//=================================================================
/**
 * {@link stretchTask} 負責將合法的 {@link Junction} 進行分組並維護 {@link Stretch} 的集合。
 *
 * 這是一般性的伸展結構理論當中特別複雜且深奧的一段，
 * 我自己也不敢說我已經完全參透了這一段，歷年來幾度我覺得我已經搞清楚了、
 * 但之後又會發現一些奇特的 edge cases 打破了那些想法。
 * 無論如何，這邊呈現的演算法是目前為止的理解之累積，實務上應該足以應付絕大多數的情境。
 */
//=================================================================
export const stretchTask = new Task(stretch, patternTask);

function stretch(): void {
	const validJunctions = getValidJunctions();

	// 第一次分組；先分組有助於加快覆蓋檢查
	const teams = grouping(validJunctions);

	for(const team of teams) processTeam(team.$junctions);

	for(const signature of State.$stretchDiff.$diff()) {
		if(State.$isDragging) {
			// 放到暫存區當中
			const s = State.$stretches.get(signature)!;
			State.$stretchCache.set(signature, s);
		}
		State.$stretches.delete(signature);
		State.$updateResult.remove.stretches.push(signature);
	}

	console.log(State.$stretches);
}

/** 分組演算法 */
function grouping(junctions: ValidJunction[]): Team[] {
	const unionFind = new ListUnionFind<number>(
		// 參與的 Quadrant 的數目最多就是 Junction 數目乘以二
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

		// 在一些少見的情況中，單一個角片可能會兩個相對的象限都出現在同一個群組中，
		// 所以有可能角片的 id 會重複，基於正確性這邊還是必須加以檢查。
		const $flaps = distinct(group.map(q => q >>> 2).sort(minComparator));

		foreachPair($flaps, (i, j) => {
			const junction = quadrantMap.get(i, j);
			if(junction) $junctions.push(junction);
		});
		result.push({ $junctions, $flaps });
	}
	return result;
}

/** 處理第一分組階段整理出來的 {@link Team} */
function processTeam(junctions: ValidJunction[]): void {
	// 檢查覆蓋
	const uncoveredJunctions = getUncoveredJunctions(junctions);
	if(uncoveredJunctions.length === 1) {
		const { $a, $b } = uncoveredJunctions[0];
		createOrUpdateStretch({
			$flaps: [$a.id, $b.id],
			$junctions: uncoveredJunctions,
		});
	} else {
		// 第二次進行分組
		const teams = grouping(uncoveredJunctions);
		for(const team of teams) createOrUpdateStretch(team);
	}
}

/** 篩選出沒有被覆蓋的 {@link ValidJunction}；這些是真的會被用來計算伸展模式的 */
function getUncoveredJunctions(junctions: ValidJunction[]): ValidJunction[] {
	if(junctions.length === 1) return junctions;
	const keys = new Set<number>();
	junctions.forEach(j => keys.add(getKey(j.$a.id, j.$b.id)));
	foreachPair(junctions, (j1, j2) => checkCovering(j1, j2, keys));
	return junctions.filter(j => !j.$isCovered);
}

/** 根據 {@link Team} 的角片結構來適度更新或創造新的 {@link Stretch} */
function createOrUpdateStretch(team: Team): void {
	const signature = team.$flaps.join(",");
	State.$stretchDiff.$add(signature);
	const oldStretch = tryGetStretch(signature);
	if(oldStretch) oldStretch.$update(team.$junctions);
	else State.$stretches.set(signature, new Stretch(team.$junctions));
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
function checkCovering(j1: ValidJunction, j2: ValidJunction, keys: Set<number>): void {
	const n = getPathIntersectionDistances(j1, j2);
	if(!n) return;
	const r1 = j1.$getBaseRectangle(n[0]);
	const r2 = j2.$getBaseRectangle(n[1]);

	if(r1.eq(r2)) {
		// 一樣大的情況中，近的覆蓋遠的
		if(j1.$isCloserThan(j2)) j2.$setCoveredBy(j1);
		else j1.$setCoveredBy(j2);
	} else if(r1.$contains(r2)) {
		if(!checkCoveringException(j1, j2, keys)) j2.$setCoveredBy(j1);
	} else if(r2.$contains(r1)) {
		if(!checkCoveringException(j1, j2, keys)) j1.$setCoveredBy(j2);
	}
}

/**
 * 這是實務上很罕見、但基於理論正確性必須做的一個例外檢查；
 * 當兩個可能互相覆蓋的 {@link ValidJunction} 左右其中一側參與的兩個角片之間再度又有 {@link ValidJunction} 的時候，
 * 此時不應該視為覆蓋。
 */
function checkCoveringException(j1: ValidJunction, j2: ValidJunction, keys: Set<number>): boolean {
	const [a1, b1] = j1.$orientedIds;
	const [a2, b2] = j2.$orientedIds;
	return a1 !== a2 && keys.has(getKey(a1, a2)) ||
		b1 !== b2 && keys.has(getKey(b1, b2));
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
