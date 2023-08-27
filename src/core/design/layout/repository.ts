import { State } from "core/service/state";
import { Store } from "./store";
import { Point } from "core/math/geometry/point";
import { configGenerator } from "./generators/configGenerator";
import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { foreachPair } from "shared/utils/array";
import { dist } from "../context/tree";
import { Quadrant, quadrantComparator } from "./pattern/quadrant";
import { SlashDirection, makePerQuadrant, quadrantNumber } from "shared/types/direction";
import { minComparator } from "shared/data/heap/heap";
import { getOrSetEmptyArray } from "shared/utils/map";
import { cache } from "core/utils/cache";
import { MutableHeap } from "shared/data/heap/mutableHeap";
import { nodeComparator } from "../context/treeNode";

import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { ITreeNode } from "../context";
import type { JRepository } from "core/service/updateModel";
import type { Pattern } from "./pattern/pattern";
import type { JStretch } from "shared/json";
import type { Configuration } from "./configuration";
import type { ValidJunction, getStructureSignature } from "./junction/validJunction";
import type { Stretch } from "./stretch";

//=================================================================
/**
 * {@link Repository} consists of several {@link Configuration}s for a {@link Stretch}.
 *
 * The motivation behind {@link Repository} is that when the structure of
 * a {@link Stretch} changes temporarily, or the {@link Stretch}
 * become temporarily inactive due to dragging,
 * a {@link Repository} helps memorizing the original combinations of {@link Pattern}s.
 */
//=================================================================
export class Repository implements ISerializable<JRepository | undefined> {

	public readonly $stretch: Stretch;

	/** Signature string created by {@link getStructureSignature}. */
	public readonly $signature: string;

	/** Coefficient of transformation; same as the {@link ValidJunction.$f $f} of the first junction. */
	public readonly $f: ISignPoint;

	/**
	 * The reference point of the stretch,
	 * which is the {@link ValidJunction.$tip} of the first junction.
	 *
	 * When all flaps involved moved simultaneously,
	 * we can use this to move the {@link Pattern}.
	 */
	public $origin: Point;

	/** Mapping quadrant codes to {@link Quadrant}s. */
	public readonly $quadrants: ReadonlyMap<number, Quadrant>;

	/** List {@link Quadrant}s by {@link QuadrantDirection} and sorted in tracing ordering. */
	public readonly $directionalQuadrants: PerQuadrant<Quadrant[]>;

	/** The ids of all nodes (not just leaves) involved. */
	public readonly $nodeIds: number[];

	public readonly $leaves: number[];

	private readonly _configurations: Store<Configuration>;
	private _index: number = 0;

	/**
	 * A {@link IntDoubleMap} mapping pairs of flap ids to their LCA.
	 * Used in {@link $distTriple} and only when there are at least three flaps.
	 */
	private readonly _lcaMap: IntDoubleMap<ITreeNode> | undefined;

	constructor(stretch: Stretch, junctions: ValidJunction[], signature: string, prototype?: JStretch) {
		this.$stretch = stretch;
		this.$signature = signature;
		this.$f = junctions[0].$f;
		this.$origin = new Point(junctions[0].$tip);

		if(junctions.length > 1) this._lcaMap = new IntDoubleMap();
		const lcaMap = this._lcaMap;
		const { map, directional, nodeIds, leaves } = createQuadrants(junctions, this._lcaMap);
		this.$quadrants = map;
		this.$directionalQuadrants = directional;
		this.$nodeIds = Array.from(nodeIds);
		this.$leaves = Array.from(leaves);

		///#if DEBUG
		this.$leaves.sort(minComparator);
		///#endif

		if(lcaMap) {
			const tree = State.$tree;
			foreachPair(this.$nodeIds, (a, b) => {
				if(!lcaMap.has(a, b)) {
					lcaMap.set(a, b, tree.$lca(tree.$nodes[a]!, tree.$nodes[b]!));
				}
			});
		}

		State.$newRepositories.add(this);
		State.$repoUpdated.add(this);

		this._configurations = new Store(configGenerator(this, junctions, prototype));
	}

	public toJSON(): JRepository | undefined {
		if(!this._configurations.$done) return undefined;
		return {
			configCount: this.$configurations.length,
			configIndex: this._index,
			patternCount: this.$configuration!.$length!,
			patternIndex: this.$configuration!.$index,
		};
	}

	public set $index(v: number) {
		this._index = v;
		this.$configuration?.$tryUpdateOrigin();
	}

	public get $direction(): SlashDirection {
		return this.$f.x == this.$f.y ? SlashDirection.FW : SlashDirection.BW;
	}

	public get $configuration(): Configuration | null {
		const configurations = this._configurations.$entries;
		if(configurations.length === 0) return null;
		return configurations[this._index];
	}

	public get $configurations(): readonly Configuration[] {
		return this._configurations.$entries;
	}

	public get $pattern(): Pattern | null {
		return this.$configuration?.$pattern ?? null;
	}

	/** Stop when the first {@link Pattern} is found. */
	public $init(): void {
		this._configurations.$next();
	}

	/** Find all {@link Pattern}s when there's free time. */
	public $complete(): void {
		this._configurations.$rest();
		for(const config of this._configurations.$entries) {
			config.$complete();
		}
	}

	/** Try to update {@link $origin}, and return if changes has been made. */
	public $tryUpdateOrigin(origin: IPoint): boolean {
		if(this.$origin.eq(origin)) return false;

		this.$origin = new Point(origin);
		this.$configurations.forEach(c => c.$originDirty = true);
		this.$configuration?.$tryUpdateOrigin();
		return true;
	}

	/**
	 * Given the ids of three flaps, return the distance from each of them to their branching node.
	 */
	public $distTriple(i1: number, i2: number, i3: number): {
		d1: number; d2: number; d3: number;
	} {
		const map = this._lcaMap!;
		const tree = State.$tree;
		const n1 = tree.$nodes[i1]!;
		const n2 = tree.$nodes[i2]!;
		const n3 = tree.$nodes[i3]!;
		const d12 = dist(n1, n2, map.get(i1, i2)!);
		const d13 = dist(n1, n3, map.get(i1, i3)!);
		const d23 = dist(n2, n3, map.get(i2, i3)!);
		const total = (d12 + d13 + d23) / 2;
		return {
			d1: total - d23,
			d2: total - d13,
			d3: total - d12,
		};
	}

	/**
	 * Mapping all nodes (except for the branch root) involved in a
	 * {@link Repository} to an array of leaf nodes under it.
	 */
	@cache public get $coverageMap(): ReadonlyMap<ITreeNode, ITreeNode[]> {
		const heap = new MutableHeap<ITreeNode>(nodeComparator);
		const result = new Map<ITreeNode, ITreeNode[]>();
		const numLeaves = this.$leaves.length;
		for(const id of this.$leaves) {
			const leaf = State.$tree.$nodes[id]!;
			heap.$insert(leaf);
			result.set(leaf, [leaf]);
		}

		while(!heap.$isEmpty) {
			const node = heap.$pop()!;
			const coverage = result.get(node)!;

			// Stop processing if we've reached the branch root
			if(coverage.length == numLeaves) {
				result.delete(node);
				continue;
			}

			const parent = node.$parent!;
			const parentCoverage = getOrSetEmptyArray(result, parent, () => heap.$insert(parent));
			parentCoverage.push(...coverage);
		}
		return result;
	}
}

interface CreateQuadrantResult {
	readonly map: ReadonlyMap<number, Quadrant>;
	readonly directional: PerQuadrant<Quadrant[]>;
	readonly nodeIds: ReadonlySet<number>;
	readonly leaves: ReadonlySet<number>;
}

function createQuadrants(junctions: ValidJunction[], lcaMap?: IntDoubleMap<ITreeNode>): CreateQuadrantResult {
	const quadrantCodes = new Map<number, ValidJunction[]>();
	const nodeIds = new Set<number>();
	const leaves = new Set<number>();
	for(const j of junctions) {
		getOrSetEmptyArray(quadrantCodes, j.$q1).push(j);
		getOrSetEmptyArray(quadrantCodes, j.$q2).push(j);
		if(lcaMap) lcaMap.set(j.$a.id, j.$b.id, j.$lca);
		j.$path.forEach(id => nodeIds.add(id));
		leaves.add(j.$a.id);
		leaves.add(j.$b.id);
	}

	const directional = makePerQuadrant<Quadrant[]>(_ => []);
	const map = new Map<number, Quadrant>();
	for(const [code, relevantJunctions] of quadrantCodes) {
		const quadrant = new Quadrant(code, relevantJunctions);
		map.set(code, quadrant);
		directional[quadrant.q].push(quadrant);
	}
	for(let q = 0; q < quadrantNumber; q++) {
		directional[q].sort(quadrantComparator);
	}
	return { map, directional, nodeIds, leaves };
}
