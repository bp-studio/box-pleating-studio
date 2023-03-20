import { Rectangle } from "core/math/geometry/rectangle";
import { opposite } from "shared/types/direction";
import { CornerType } from "shared/json/enum";

import type { JJunction } from "shared/json";
import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection } from "shared/types/direction";

interface ValidJunctionData {
	lca: ITreeNode;
	s: IPoint;
	o: IPoint;
	f: IPoint;
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

	/** The tip corresponding to {@link $a}. */
	private readonly _tip: IPoint;

	/** Coefficient of transformation. */
	private readonly _f: IPoint;

	/** All {@link ValidJunction}s that covers self geometrically. */
	private readonly _geometricallyCoveredBy: ValidJunction[] = [];

	constructor(a: ITreeNode, b: ITreeNode, data: ValidJunctionData) {
		this.$a = a;
		this.$b = b;

		this.$lca = data.lca;
		this.$s = data.s;
		this.$o = data.o;
		this._f = data.f;
		this._tip = data.tip;

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
		return this._f.x > 0 ? [a, b] : [b, a];
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
		const x = this._tip.x + distanceToA * this._f.x;
		const y = this._tip.y + distanceToA * this._f.y;
		return new Rectangle({ x, y }, { x: x - this.$o.x * this._f.x, y: y - this.$o.y * this._f.y });
	}
}

export function getStructureSignature(junctions: ValidJunction[]): string {
	return JSON.stringify(junctions.map(j => j.toJSON()));
}
