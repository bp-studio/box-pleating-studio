import { Rectangle } from "core/math/geometry/rectangle";
import { opposite, makeQuadrantCode, getQuadrant } from "shared/types/direction";
import { CornerType } from "shared/json/enum";

import type { QuadrantCode, QuadrantDirection } from "shared/types/direction";
import type { JJunction, NodeId } from "shared/json";
import type { ITreeNode } from "core/design/context";

interface ValidJunctionData {
	lca: ITreeNode;
	s: IPoint;
	o: IPoint;
	f: ISignPoint;
	dir: QuadrantDirection;
	tip: IPoint;
}

export type Junctions = readonly ValidJunction[];

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
	public readonly $q1: QuadrantCode;

	/** The quadrant code of {@link $b}. */
	public readonly $q2: QuadrantCode;

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

		this.$q1 = makeQuadrantCode(a.id, data.dir);
		this.$q2 = makeQuadrantCode(b.id, opposite(data.dir));
	}

	toJSON(): JJunction {
		return {
			c: [
				{ type: CornerType.flap, e: this.$a.id, q: getQuadrant(this.$q1) },
				{ type: CornerType.side },
				{ type: CornerType.flap, e: this.$b.id, q: getQuadrant(this.$q2) },
				{ type: CornerType.side },
			],
			f: this.$f,
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
			const that = this._geometricallyCoveredBy.find(j => !j.$isCovered);
			// Uncomment the next line for coverage debugging
			// if(that) console.log(`Junction ${this.$a.id},${this.$b.id} is covered by ${that.$a.id},${that.$b.id}`);
			this._isCovered = Boolean(that);
		}
		return this._isCovered;
	}
	private _isCovered: boolean | undefined;

	/** Get all {@link ValidJunction}s covering the current one. */
	public $getCovering(): ValidJunction[] {
		return this._geometricallyCoveredBy.filter(j => !j.$isCovered);
	}

	public $involves(id: NodeId): boolean {
		return this.$a.id == id || this.$b.id == id;
	}

	/** Signal a geometrical covering. */
	public $setGeometricallyCoveredBy(that: ValidJunction): void {
		this._geometricallyCoveredBy.push(that);
	}

	/** Clear covering data. */
	public $resetCovering(): void {
		this._geometricallyCoveredBy.length = 0;
		this._isCovered = undefined;
	}

	/**
	 * This method is mainly used in the case where the comparison rectangles are of the same size.
	 * In that case, the junction corresponding to the closer flap should cover the other one.
	 *
	 * v0.7: Note that if the comparison rectangles are not of the same size,
	 * then the result can mutually be `true`.
	 */
	public $isCloserThan(that: ValidJunction): boolean {
		return this.$s.x < that.$s.x || this.$s.y < that.$s.y;
	}

	/** Based on the given canonical distance to get the comparison rectangle. */
	public $getBaseRectangle(distanceToA: number): Rectangle {
		const x = this.$tip.x + distanceToA * this.$f.x;
		const y = this.$tip.y + distanceToA * this.$f.y;
		return new Rectangle({ x, y }, { x: x - this.$o.x * this.$f.x, y: y - this.$o.y * this.$f.y });
	}

	/** Create a {@link JJunction} matching the given transformation. */
	public $toOrientedJSON(f: ISignPoint): JJunction {
		const result = this.toJSON();
		if(result.f.x !== f.x) {
			result.f = f;
			[result.c[0], result.c[2]] = [result.c[2], result.c[0]];
		}
		return result;
	}
}

export function getStructureSignature(junctions: Junctions): string {
	// Orientation doesn't matter here.
	return JSON.stringify(junctions.map(junction => junction.toJSON()));
}
