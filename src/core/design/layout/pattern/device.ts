import { Gadget } from "./gadget";
import { AddOn } from "./addOn";
import { cache } from "core/utils/cache";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { CornerType } from "shared/json";
import { Vector } from "core/math/geometry/vector";
import { State } from "core/service/state";
import { clone } from "shared/utils/clone";

import type { Partition } from "../partition";
import type { JDevice, JConnection } from "shared/json";
import type { Contour, ILine } from "shared/types/geometry";
import type { Region } from "./region";
import type { Pattern } from "./pattern";

//=================================================================
/**
 * {@link Device} is the smallest movable unit in a {@link Pattern}.
 */
//=================================================================
export class Device implements ISerializable<JDevice> {

	public readonly $pattern: Pattern;
	public readonly $partition: Partition;
	public readonly $gadgets: readonly Gadget[];
	public readonly $addOns: readonly AddOn[];

	private readonly _regions: readonly Region[];

	public $anchors!: readonly Point[][];
	public $location!: IPoint;

	private _delta!: Vector;
	private readonly _originalDisplacement: Vector;

	constructor(pattern: Pattern, partition: Partition, data: JDevice) {
		this.$pattern = pattern;
		this.$partition = partition;
		this.$gadgets = data.gadgets.map(g => new Gadget(g));
		this.$addOns = data.addOns?.map(a => new AddOn(a)) ?? [];
		this._originalDisplacement = partition.$getOriginalDisplacement(pattern);
		this.$offset = data.offset ?? 0;

		// Collect regions
		const regions: Region[] = [];
		for(const g of this.$gadgets) regions.push(...g.pieces);
		regions.push(...this.$addOns);
		this._regions = regions;

		State.$movedDevices.add(this);
	}

	public toJSON(): JDevice {
		return {
			gadgets: clone(this.$gadgets),
			offset: this.$offset,
			addOns: this.$addOns.length ? this.$addOns : undefined,
		};
	}

	public get $offset(): number {
		let dx = this.$partition.$getOriginalDisplacement(this.$pattern).x;
		dx -= this._originalDisplacement.x;
		return (this.$location.x - dx) * this.$pattern.$config.$repo.$f.x;
	}
	public set $offset(v: number) {
		const { x, y } = this.$pattern.$config.$repo.$f;
		this.$location = { x: v * x, y: v * y };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Update parameters after the {@link Device} have moved. */
	public $updatePosition(): void {
		// Update delta
		const origin = this.$pattern.$config.$repo.$origin.$add(this._originalDisplacement);
		this._delta = origin.$add(new Vector(this.$location)).sub(Point.ZERO);

		// Update anchors
		const result: Point[][] = [];
		for(const g of this.$gadgets) {
			result.push(g.$anchorMap.map(m => this._transform(m[0])));
		}
		this.$anchors = result;
	}

	/** All ridges that should be drawn. */
	public get $ridges(): readonly ILine[] {
		//TODO: eliminate overlapping with neighbors
		const selfRidges = this._rawRidges.map(l => this._transform(l).$toILine());
		const outerRidges = this._getOuterRidges().map(l => l.$toILine());
		return selfRidges.concat(outerRidges);
	}

	/** All axis-parallel creases that should be drawn. */
	public get $axisParallels(): readonly ILine[] {
		const result: Line[] = [];
		for(const r of this._regions) {
			for(const l of r.$axisParallels) {
				result.push(this._transform(l));
			}
		}
		return result.map(l => l.$toILine());
	}

	/** Contours for the devices. Used for drawing selection shade. */
	public get $contour(): readonly Contour[] {
		return this._regions.map(r => ({
			outer: r.$shape.contour.map(p => this._transform(p).$toIPoint()),
		}));
	}

	public $getDraggingRange(): readonly [number, number] {
		const fx = this.$pattern.$config.$repo.$f.x;
		const result = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY] as [number, number];
		for(const c of this.$partition.$constraints) {
			const isOut = c.corner.type != CornerType.socket;
			const q = isOut ? c.anchorIndex : c.corner.q!;
			const f = fx * (q == 0 ? -1 : 1);
			const target = this.$pattern.$getConnectionTarget(c.corner as JConnection);
			const slack = isOut ?
				this.$gadgets[c.overlapIndex].$slack[c.anchorIndex] :
				this.$pattern.$gadgets[-c.corner.e! - 1].$slack[c.corner.q!];
			const bound = target.x - this.$anchors[c.overlapIndex][c.anchorIndex].x - slack * f;
			if(f > 0 && result[1] > bound) result[1] = bound;
			else if(f < 0 && result[0] < bound) result[0] = bound;
		}
		return result;
	}

	public $getConnectionRidges(internalOnly: boolean): Line[] {
		const result: Line[] = [];
		for(const [i, ov] of this.$partition.$overlaps.entries()) {
			for(const [q, c] of ov.c.entries()) {
				if(c.type == CornerType.flap && !internalOnly || c.type == CornerType.internal) {
					result.push(new Line(
						this.$anchors[i][q],
						this.$pattern.$getConnectionTarget(c as JConnection)
					));
				}
			}
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _transform<T extends Point | Line>(obj: T): T {
		const f = this.$pattern.$config.$repo.$f;
		return obj.$transform(f.x, f.y).$add(this._delta) as T;
	}

	/**
	 * Ridges of the {@link Region}s before transformation.
	 * The result is constant, so it is cached.
	 */
	@cache private get _rawRidges(): readonly Line[] {
		const result: Line[] = [];
		for(const region of this._regions) {
			const parallelRegions = this._regions.filter(
				q => q != region && q.$direction.$parallel(region.$direction)
			);

			// Ridges that are perpendicular to the axis-parallel creases
			// should not be eliminated (this happens in meandering)
			const lines = parallelRegions.flatMap(
				q => q.$shape.ridges.filter(l => !l.$perpendicular(q.$direction))
			);

			result.push(...Line.$subtract(region.$shape.ridges, lines));
		}
		return Line.$distinct(result);
	}

	private _getOuterRidges(): readonly Line[] {
		const result = this.$getConnectionRidges(false);
		//TODO: IntersectionMap
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Static methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Generate a signature for a given list of {@link JDevice},
	 * disregarding positional information.
	 */
	public static $getSignature(devices: readonly JDevice[]): string {
		return JSON.stringify(devices.map(d => {
			d.gadgets.forEach(g => Gadget.$simplify(g));
			delete d.offset;
			return d;
		}));
	}
}
