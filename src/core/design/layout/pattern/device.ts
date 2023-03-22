import { Gadget } from "./gadget";
import { AddOn } from "./addOn";
import { cache } from "core/utils/cache";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";

import type { Vector } from "core/math/geometry/vector";
import type { ILine } from "shared/types/geometry";
import type { Region } from "./region";
import type { JDevice } from "shared/json";
import type { Pattern } from "./pattern";

//=================================================================
/**
 * {@link Device} is the smallest movable unit in a {@link Pattern}.
 */
//=================================================================
export class Device implements ISerializable<JDevice> {

	public readonly $pattern: Pattern;
	public readonly $gadgets: readonly Gadget[];
	public readonly $addOns: readonly AddOn[];

	private readonly _regions: readonly Region[];

	constructor(pattern: Pattern, data: JDevice) {
		this.$pattern = pattern;
		this.$gadgets = data.gadgets.map(g => new Gadget(g));
		this.$addOns = data.addOns?.map(a => new AddOn(a)) ?? [];

		// Collect regions
		const regions: Region[] = [];
		for(const g of this.$gadgets) regions.push(...g.pieces);
		regions.push(...this.$addOns);
		this._regions = regions;
	}

	public toJSON(): JDevice {
		return {
			gadgets: this.$gadgets,
			addOns: this.$addOns.length ? this.$addOns : undefined,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $ridges(): readonly ILine[] {
		//TODO: eliminate overlapping with neighbors
		return this._transformedRidges.map(l => l.$toILine());
	}

	public get $axisParallels(): readonly ILine[] {
		const f = this.$pattern.$config.$repo.$f;
		const result: Line[] = [];
		for(const r of this._regions) {
			for(const l of r.$axisParallels) {
				result.push(l.$transform(f.x, f.y).$shift(this._delta));
			}
		}
		return result.map(l => l.$toILine());
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private get _delta(): Vector {
		//TODO: originalDisplacement and location
		return this.$pattern.$config.$repo.$origin.sub(Point.ZERO);
	}

	private get _transformedRidges(): readonly Line[] {
		const f = this.$pattern.$config.$repo.$f;
		return this._rawRidges.map(l => l.$transform(f.x, f.y).$shift(this._delta));
	}

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
}
