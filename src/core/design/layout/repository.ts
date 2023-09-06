import { State } from "core/service/state";
import { Store } from "./store";
import { Point } from "core/math/geometry/point";
import { configGenerator } from "./generators/configGenerator";
import { dist } from "../context/tree";
import { Quadrant, quadrantComparator } from "./pattern/quadrant";
import { SlashDirection, makePerQuadrant, quadrantNumber } from "shared/types/direction";
import { getOrSetEmptyArray } from "shared/utils/map";
import { RepoNodeSet } from "./repoNodeSet";

import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { Pattern } from "./pattern/pattern";
import type { JQuadrilateral, JRepository, JStretch } from "shared/json";
import type { Configuration } from "./configuration";
import type { ValidJunction, Junctions, getStructureSignature } from "./junction/validJunction";
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

	/** Mapping quadrant codes to {@link Quadrant}s. */
	public readonly $quadrants: ReadonlyMap<number, Quadrant>;

	/** List {@link Quadrant}s by {@link QuadrantDirection} and sorted in tracing ordering. */
	public readonly $directionalQuadrants: PerQuadrant<Quadrant[]>;

	/**
	 * The reference point of the stretch,
	 * which is the {@link ValidJunction.$tip} of the first junction.
	 *
	 * When all flaps involved moved simultaneously,
	 * we can use this to move the {@link Pattern}.
	 */
	public $origin: Point;

	/** {@link RepoNodeSet} associated with this {@link Repository}. */
	public $nodeSet: RepoNodeSet;

	private readonly _configurations: Store<Configuration>;

	/** The current index of {@link Configuration}. */
	private _index: number = 0;

	constructor(stretch: Stretch, junctions: Junctions, signature: string, prototype?: JStretch) {
		this.$stretch = stretch;
		this.$signature = signature;
		this.$f = junctions[0].$f;
		this.$origin = new Point(junctions[0].$tip);

		const { map, directional } = createQuadrants(junctions);
		this.$quadrants = map;
		this.$directionalQuadrants = directional;
		this.$nodeSet = new RepoNodeSet(junctions, map);

		State.$newRepositories.add(this);
		State.$repoToProcess.add(this);

		this._configurations = new Store(configGenerator(this, junctions, prototype));
		if(prototype?.repo) {
			this._configurations.$rest();
			this._index = prototype.repo.index;
		}
	}

	public toJSON(): JRepository | undefined {
		if(!this._configurations.$done) return undefined;
		return {
			configurations: this.$configurations.map(c => c.toJSON(true)),
			index: this._index,
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
		const tree = State.$tree;
		const n1 = tree.$nodes[i1]!;
		const n2 = tree.$nodes[i2]!;
		const n3 = tree.$nodes[i3]!;
		const d12 = dist(n1, n2, this.$nodeSet.$lca(i1, i2));
		const d13 = dist(n1, n3, this.$nodeSet.$lca(i1, i3));
		const d23 = dist(n2, n3, this.$nodeSet.$lca(i2, i3));
		const total = (d12 + d13 + d23) / 2;
		return {
			d1: total - d23,
			d2: total - d13,
			d3: total - d12,
		};
	}

	/**
	 * In a 3-flap layout, calculate the maximal allowing distance from the intersection anchor to the shared corner.
	 * @param oriented Sharing lower-left corner
	 */
	public $getMaxIntersectionDistance(r1: JQuadrilateral, r2: JQuadrilateral, oriented: boolean): number {
		const q = oriented ? 2 : 0;
		const n1 = r1.c[q].e!;
		const n2 = r2.c[q].e!;
		const n3 = r1.c[2 - q].e!;
		return this.$distTriple(n1, n2, n3).d3;
	}
}

interface CreateQuadrantResult {
	readonly map: ReadonlyMap<number, Quadrant>;
	readonly directional: PerQuadrant<Quadrant[]>;
}

function createQuadrants(junctions: Junctions): CreateQuadrantResult {
	const quadrantCodes = new Map<number, ValidJunction[]>();
	for(const j of junctions) {
		getOrSetEmptyArray(quadrantCodes, j.$q1).push(j);
		getOrSetEmptyArray(quadrantCodes, j.$q2).push(j);
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

	return { map, directional };
}
