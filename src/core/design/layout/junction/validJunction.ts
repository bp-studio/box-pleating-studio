import { Rectangle } from "core/math/geometry/rectangle";
import { opposite } from "shared/types/direction";
import { CornerType } from "shared/json/enum";
import { cache } from "core/utils/cache";

import type { JJunction } from "shared/json";
import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection } from "shared/types/direction";

interface ValidJunctionData {
	lca: ITreeNode;
	s: IPoint;
	o: IPoint;
	f: ISignPoint;
	dir: QuadrantDirection;
	tip: IPoint;
}

const MASK = 3;

//=================================================================
/**
 * {@link ValidJunction} represents a valid overlapping between flaps.
 */
//=================================================================

export class ValidJunction implements ISerializable<JJunction> {

	/** The first flap. */
	public readonly $a: ITreeNode;

	/** The second flap. */
	public readonly $b: ITreeNode;

	public readonly $valid = true;

	/** LCA of the two flaps. */
	public readonly $lca: ITreeNode;

	/** The quadrant code of {@link $a}. */
	public readonly $q1: number;

	/** The quadrant code of {@link $b}. */
	public readonly $q2: number;

	/** The dimension of the tip rectangle. */
	public readonly $s: IPoint;

	/** The dimension of the overlapping region. */
	public readonly $o: IPoint;

	/** Coefficient of transformation. */
	public readonly $f: ISignPoint;

	/** The tip corresponding to {@link $a}. */
	public readonly $tip: IPoint;

	/** All {@link ValidJunction}s that covers self geometrically. */
	private readonly _geometricallyCoveredBy: ValidJunction[] = [];

	constructor(a: ITreeNode, b: ITreeNode, data: ValidJunctionData) {
		this.$a = a;
		this.$b = b;

		this.$lca = data.lca;
		this.$s = data.s;
		this.$o = data.o;
		this.$f = data.f;
		this.$tip = data.tip;

		this.$q1 = a.id << 2 | data.dir;
		this.$q2 = b.id << 2 | opposite(data.dir);
	}

	toJSON(): JJunction {
		return {
			c: [
				{ type: CornerType.$flap, e: this.$a.id, q: this.$q1 & MASK },
				{ type: CornerType.$side },
				{ type: CornerType.$flap, e: this.$b.id, q: this.$q2 & MASK },
				{ type: CornerType.$side },
			],
			ox: this.$o.x,
			oy: this.$o.y,
			sx: this.$s.x,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $orientedIds(): [number, number] {
		const [a, b] = [this.$a.id, this.$b.id];
		return this.$f.x > 0 ? [a, b] : [b, a];
	}

	/**
	 * Whether self is "practically" covered by another {@link ValidJunction}.
	 *
	 * The notion of practical covering is one step further of geometrical covering.
	 * If A covers B, B covers C, and C is not covered by any other {@link ValidJunction}s other than B,
	 * then since B will be invalidated by A, the covering of B over C also doesn't count,
	 * so practically C is not really covered. And so on.
	 */
	public get $isCovered(): boolean {
		if(this._isCovered === undefined) {
			this._isCovered = this._geometricallyCoveredBy.some(j => !j.$isCovered);
		}
		return this._isCovered;
	}
	private _isCovered: boolean | undefined;

	/** Signal a geometrical covering. */
	public $setGeometricallyCoveredBy(that: ValidJunction): void {
		this._geometricallyCoveredBy.push(that);
	}

	/** Clear covering data. */
	public $resetCovering(): void {
		this._geometricallyCoveredBy.length = 0;
		this._isCovered = undefined;
	}

	/** When the comparison rectangle is of the same size, the closer one goes first. */
	public $isCloserThan(that: ValidJunction): boolean {
		return this.$s.x < that.$s.x || this.$s.y < that.$s.y;
	}

	/** Based on the given canonical distance to get the comparison rectangle. */
	public $getBaseRectangle(distanceToA: number): Rectangle {
		const x = this.$tip.x + distanceToA * this.$f.x;
		const y = this.$tip.y + distanceToA * this.$f.y;
		return new Rectangle({ x, y }, { x: x - this.$o.x * this.$f.x, y: y - this.$o.y * this.$f.y });
	}

	@cache public get $path(): number[] {
		let a = this.$a, b = this.$b;
		const result = [a.id, b.id];
		while(a !== b) {
			if(a.$dist >= b.$dist) {
				a = a.$parent!;
				if(a.$parent) result.push(a.id);
			} else {
				b = b.$parent!;
				if(b.$parent) result.push(b.id);
			}
		}
		return result;
	}
}

export function getStructureSignature(junctions: ValidJunction[]): string {
	return JSON.stringify(junctions.map(j => j.toJSON()));
}
