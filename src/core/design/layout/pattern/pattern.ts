
import { Device } from "./device";
import { Point } from "core/math/geometry/point";
import { State } from "core/service/state";

import type { Gadget } from "./gadget";
import type { JConnection, JDevice, JPattern } from "shared/json";
import type { Configuration } from "../configuration";

//=================================================================
/**
 * {@link Pattern} is a complete set of crease pattern for a {@link Configuration}.
 * A {@link Configuration} could have many {@link Pattern}s to choose from.
 */
//=================================================================
export class Pattern implements ISerializable<JPattern> {

	public readonly $config: Configuration;

	//TODO: Complete the logic of deciding validity of a pattern (whether it actually fits the layout)
	public $valid: boolean = true;

	public readonly $devices: readonly Device[];
	public readonly $gadgets: readonly Gadget[];

	public $originDirty: boolean = false;

	constructor(config: Configuration, devices: JDevice[]) {
		this.$config = config;
		this.$devices = devices.map((d, i) => new Device(this, config.$partitions[i], d));
		this.$gadgets = this.$devices.flatMap(d => d.$gadgets);
	}

	public toJSON(): JPattern {
		return {
			devices: this.$devices.map(d => d.toJSON()),
		};
	}

	/** Return the {@link Point} by the given {@link JConnection}. */
	public $getConnectionTarget(c: JConnection): Point {
		if(c.e >= 0) {
			return new Point(State.$tree.$nodes[c.e]!.$AABB.$points[c.q]);
		} else {
			const [i, j] = this.$config.$overlapMap.get(c.e)!;
			return this.$devices[i].$anchors[j][c.q];
		}
	}

	public $tryUpdateOrigin(): void {
		if(!this.$originDirty) return;
		this.$devices.forEach(d => State.$movedDevices.add(d));
		this.$originDirty = false;
	}
}
