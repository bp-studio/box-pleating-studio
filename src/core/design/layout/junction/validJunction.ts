import { Rectangle } from "core/math/geometry/rectangle";
import { opposite, makeQuadrantCode, getQuadrant } from "shared/types/direction";
import { CornerType } from "shared/json/enum";

import type { QuadrantCode, QuadrantDirection } from "shared/types/direction";
import type { JJunction, NodeId } from "shared/json";
import type { ITreeNode } from "core/design/context";
import type { IRect } from "core/design/tasks/utils/carve";

interface ValidJunctionData {
	lca: ITreeNode;
	s: IPoint;
	o: IPoint;
	f: ISignPoint;
	dir: QuadrantDirection;
	tip: IPoint;
}

export type Junctions = readonly ValidJunction[];

/** See {@link ValidJunction.$invasion}. */
export interface Invasion {
	/** The flap being invaded (the larger one). */
	readonly flap: ITreeNode;
	/** The overlapping region, positioned at the corner of the hinge rectangle of {@link flap}. */
	readonly rect: IRect;
}

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

	/**
	 * Whether this junction is an "invasion" of a relatively small flap into the territory of a large flap.
	 *
	 * The rough contours are made by expanding the flaps and taking unions, regardless of the junctions.
	 * That works in most cases, but when a flap A, even after expanding to the LCA,
	 * is still smaller than the overlapping region in width or height,
	 * while the other flap B has a hinge rectangle larger than the overlapping region in both dimensions,
	 * then the region of B should be carved out by the overlapping region at its corner
	 * (see {@link roughContourTask}).
	 */
	public get $invasion(): Invasion | undefined {
		if(this._invasion === undefined) this._invasion = this._computeInvasion();
		return this._invasion || undefined;
	}
	private _invasion: Invasion | null | undefined;

	private _computeInvasion(): Invasion | null {
		const [a, b] = [this.$a, this.$b];
		const rA = a.$dist - this.$lca.$dist;
		const rB = b.$dist - this.$lca.$dist;
		if(this._isSmall(a, rA) && this._isLarge(b)) return this._makeInvasion(b, -1);
		if(this._isSmall(b, rB) && this._isLarge(a)) return this._makeInvasion(a, 1);
		return null;
	}

	/** Whether the flap is smaller than the overlapping region in width or height after expanding by `r`. */
	private _isSmall(flap: ITreeNode, r: number): boolean {
		const [t, right, bottom, l] = flap.$AABB.$toValues();
		return right - l + 2 * r < this.$o.x || t - bottom + 2 * r < this.$o.y;
	}

	/** Whether the hinge rectangle of the flap is larger than the overlapping region in both dimensions. */
	private _isLarge(flap: ITreeNode): boolean {
		const [t, right, bottom, l] = flap.$AABB.$toValues();
		const len = flap.$length;
		return right - l + 2 * len > this.$o.x && t - bottom + 2 * len > this.$o.y;
	}

	/** @param sign 1 if the flap is {@link $a} (so that the other flap is in the direction {@link $f}), -1 otherwise. */
	private _makeInvasion(flap: ITreeNode, sign: 1 | -1): Invasion {
		const q = getQuadrant(sign === 1 ? this.$q1 : this.$q2);
		const tip = flap.$AABB.$points[q];
		const fx = this.$f.x * sign, fy = this.$f.y * sign;
		const len = flap.$length;
		const cx = tip.x + fx * len, cy = tip.y + fy * len; // The hinge corner facing the other flap
		const ix = cx - fx * this.$o.x, iy = cy - fy * this.$o.y; // The inner corner of the overlapping region
		const rect: IRect = {
			x1: Math.min(cx, ix), y1: Math.min(cy, iy),
			x2: Math.max(cx, ix), y2: Math.max(cy, iy),
		};
		return { flap, rect };
	}

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
