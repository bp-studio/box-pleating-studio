import { MutableHeap } from "shared/data/heap/mutableHeap";
import { nodeComparator } from "../context/treeNode";
import { getOrSetEmptyArray } from "shared/utils/map";
import { State } from "core/service/state";
import { minComparator } from "shared/data/heap/heap";
import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { quadrantNumber } from "shared/types/direction";
import { dist } from "../context/tree";

import type { Quadrant } from "./pattern/quadrant";
import type { ITreeNode } from "../context";
import type { Junctions } from "./junction/validJunction";
import type { Repository } from "./repository";

//=================================================================
/**
 * {@link NodeSet} keeps a record for the nodes and coverage info in a {@link Repository}.
 */
//=================================================================
export class NodeSet {

	public readonly $leaves: readonly number[];
	public readonly $nodes: readonly number[];
	public readonly $coverage: ReadonlyMap<ITreeNode, Quadrant[]>;

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

	constructor(junctions: Junctions, quadrants: ReadonlyMap<number, Quadrant>) {
		this.$leaves = getLeaves(junctions);

		const heap = new MutableHeap<ITreeNode>(nodeComparator);
		const coverage = new Map<ITreeNode, Quadrant[]>();
		const numLeaves = this.$leaves.length;
		for(const id of this.$leaves) {
			const leaf = State.$tree.$nodes[id]!;
			heap.$insert(leaf);
			const covered: Quadrant[] = [];
			for(let q = 0; q < quadrantNumber; q++) {
				const quadrant = quadrants.get(leaf.id << 2 | q);
				if(quadrant) covered.push(quadrant);
			}
			coverage.set(leaf, covered);
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
			const parent = node.$parent;
			if(!parent) continue;
			const parentCoverage = getOrSetEmptyArray(coverage, parent, () => heap.$insert(parent));
			if(this._lcaMap && parentCoverage.length) {
				for(const A of parentCoverage) {
					for(const B of coveredLeaves) this._lcaMap.set(A.$flap.id, B.$flap.id, parent);
				}
			}
			parentCoverage.push(...coveredLeaves);
		}

		nodes.sort(minComparator);
		this.$coverage = coverage;
		this.$nodes = nodes;
	}

	/**
	 * Given the ids of three flaps, return the distance from each of them to their branching node.
	 */
	public $distTriple(i1: number, i2: number, i3: number): {
		d1: number; d2: number; d3: number;
	} {
		const tree = State.$tree;
		const n1 = tree.$nodes[i1]!;
		const n2 = tree.$nodes[i2]!;
		const n3 = tree.$nodes[i3]!;
		const d12 = this._dist(n1, n2);
		const d13 = this._dist(n1, n3);
		const d23 = this._dist(n2, n3);
		const total = (d12 + d13 + d23) / 2;
		return {
			d1: total - d23,
			d2: total - d13,
			d3: total - d12,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _dist(a: ITreeNode, b: ITreeNode): number {
		if(a === b) return 0;
		return dist(a, b, this._lca(a.id, b.id));
	}

	private _lca(a: number, b: number): ITreeNode {
		const lcaMap = this._lcaMap!;
		let lca = lcaMap.get(a, b);
		if(lca) return lca;

		// Otherwise, it suffices to pick a leaf covered by each
		// of the given nodes and lookup the LCA of the leaves.
		const tree = State.$tree;
		const A = tree.$nodes[a]!;
		const B = tree.$nodes[b]!;
		const ALeaf = this.$coverage.get(A)![0].$flap.id;
		const BLeaf = this.$coverage.get(B)![0].$flap.id;
		lca = lcaMap.get(ALeaf, BLeaf)!;
		lcaMap.set(a, b, lca);
		return lca;
	}
}

function getLeaves(junctions: Junctions): number[] {
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
