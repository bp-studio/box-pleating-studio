import { State } from "core/service/state";
import { Store } from "./store";
import { generalConfigGenerator } from "./generators/generalConfigGenerator";
import { singleConfigGenerator } from "./generators/singleConfigGenerator";
import { Point } from "core/math/geometry/point";

import type { JRepository } from "core/service/updateModel";
import type { Pattern } from "./pattern/pattern";
import type { JStretch } from "shared/json";
import type { Configuration } from "./configuration";
import type { ValidJunction } from "./junction/validJunction";
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
	public readonly $signature: string;

	/** Coefficient of transformation; same as the {@link ValidJunction.$f $f} of the first junction. */
	public readonly $f: ISignPoint;

	/** The reference point of the stretch. */
	public readonly $origin: Point;

	/** Quadrant codes involved (possibly duplicated). */
	public readonly $quadrants: number[];

	/** Node ids involved. */
	public readonly $nodes: number[];

	public $index: number = 0;

	private readonly _configurations: Store<Configuration>;

	constructor(stretch: Stretch, junctions: ValidJunction[], signature: string, prototype?: JStretch) {
		this.$stretch = stretch;
		this.$signature = signature;
		this.$f = junctions[0].$f;
		this.$origin = new Point(junctions[0].$tip);

		const quadrants: number[] = [];
		const ids = new Set<number>();
		for(const j of junctions) {
			quadrants.push(j.$q1, j.$q2);
			j.$path.forEach(id => ids.add(id));
		}
		this.$quadrants = quadrants;
		this.$nodes = Array.from(ids);

		State.$newRepositories.add(this);
		State.$repoUpdated.add(this);

		if(junctions.length === 1) {
			this._configurations = new Store(singleConfigGenerator(this, junctions[0], prototype));
		} else {
			this._configurations = new Store(generalConfigGenerator(this, junctions, prototype));
		}
	}

	public toJSON(): JRepository | undefined {
		if(!this._configurations.$done) return undefined;
		return {
			configCount: this.$configurations.length,
			configIndex: this.$index,
			patternCount: this.$configuration!.$length!,
			patternIndex: this.$configuration!.$index,
		};
	}

	public get $configuration(): Configuration | null {
		const configurations = this._configurations.$entries;
		if(configurations.length === 0) return null;
		return configurations[this.$index];
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
}
