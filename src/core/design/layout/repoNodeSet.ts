import { MutableHeap } from "shared/data/heap/mutableHeap";
import { nodeComparator } from "../context/treeNode";
import { getOrSetEmptyArray } from "shared/utils/map";
import { State } from "core/service/state";
import { minComparator } from "shared/data/heap/heap";
import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";

import type { ITreeNode } from "../context";
import type { ValidJunction } from "./junction/validJunction";
import type { Repository } from "./repository";

//=================================================================
/**
 * {@link RepoNodeSet} keeps a record for the nodes and coverage info in a {@link Repository}.
 */
//=================================================================
export class RepoNodeSet {

	public readonly $leaves: readonly number[];
	public readonly $nodes: readonly number[];
	public readonly $coverage: ReadonlyMap<ITreeNode, ITreeNode[]>;

	/**
	 * A {@link IntDoubleMap} mapping pairs of flap ids to their LCA.
	 *
	 * After the constructor, it contains only the LCAs for pairs of leaves,
	 * and the rest will be inferred and cached on demand.
	 *
	 * This new algorithm completely removes the need of tracking
	 * or calculating LCA in general for the whole tree.
	 */
	private readonly _lcaMap: IntDoubleMap<ITreeNode> | undefined;

	constructor(junctions: ValidJunction[]) {
		this.$leaves = getLeaves(junctions);

		const heap = new MutableHeap<ITreeNode>(nodeComparator);
		const coverage = new Map<ITreeNode, ITreeNode[]>();
		const numLeaves = this.$leaves.length;
		for(const id of this.$leaves) {
			const leaf = State.$tree.$nodes[id]!;
			heap.$insert(leaf);
			coverage.set(leaf, [leaf]);
		}

		const nodes = [];
		if(junctions.length > 1) this._lcaMap = new IntDoubleMap();
		while(!heap.$isEmpty) {
			const node = heap.$pop()!;
			const coveredLeaves = coverage.get(node)!;

			// Stop processing if we've reached the LCA
			if(coveredLeaves.length == numLeaves) {
				coverage.delete(node);
				continue;
			}

			nodes.push(node.id);
			const parent = node.$parent!;
			const parentCoverage = getOrSetEmptyArray(coverage, parent, () => heap.$insert(parent));
			if(this._lcaMap && parentCoverage.length) {
				for(const A of parentCoverage) {
					for(const B of coveredLeaves) this._lcaMap.set(A.id, B.id, parent);
				}
			}
			parentCoverage.push(...coveredLeaves);
		}

		nodes.sort(minComparator);
		this.$coverage = coverage;
		this.$nodes = nodes;
	}

	public $lca(a: number, b: number): ITreeNode {
		const lcaMap = this._lcaMap!;
		let lca = lcaMap.get(a, b);
		if(lca) return lca;

		// Otherwise, it suffices to pick a leaf covered by each
		// of the given nodes and lookup the LCA of the leaves.
		const tree = State.$tree;
		const A = tree.$nodes[a]!;
		const B = tree.$nodes[b]!;
		const ALeaf = this.$coverage.get(A)![0].id;
		const BLeaf = this.$coverage.get(B)![0].id;
		lca = lcaMap.get(ALeaf, BLeaf)!;
		lcaMap.set(a, b, lca);
		return lca;
	}
}

function getLeaves(junctions: ValidJunction[]): number[] {
	const leafSet = new Set<number>();
	for(const j of junctions) {
		leafSet.add(j.$a.id);
		leafSet.add(j.$b.id);
	}
	const leaves = Array.from(leafSet);
	///#if DEBUG
	leaves.sort(minComparator);
	///#endif
	return leaves;
}
