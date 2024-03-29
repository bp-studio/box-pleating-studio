
import { Device } from "./device";
import { Point } from "core/math/geometry/point";
import { State } from "core/service/state";
import { singleJunctionPositioner } from "./positioners/singleJunctionPositioner";
import { twoJunctionPositioner } from "./positioners/twoJunctionPositioner";
import { PositioningContext } from "./positioners/positioningContext";

import type { Gadget } from "./gadget";
import type { JConnection, JDevice, JPattern, NodeId, OverlapId } from "shared/json";
import type { Configuration } from "../configuration";

//=================================================================
/**
 * {@link Pattern} is a complete set of crease pattern for a {@link Configuration}.
 * A {@link Configuration} could have many {@link Pattern}s to choose from.
 */
//=================================================================
export class Pattern implements ISerializable<JPattern> {

	public readonly $config: Configuration;
	public readonly $valid: boolean;
	public readonly $devices: readonly Device[];
	public readonly $gadgets: readonly Gadget[];

	/** A flag indicating the origin needs to be updated. */
	public $originDirty: boolean = false;

	/**
	 * @param seeded Signify that this is a seeded pattern, and positioning is not needed.
	 */
	constructor(config: Configuration, devices: readonly JDevice[], seeded?: boolean) {
		this.$config = config;
		this.$devices = devices.map((d, i) => new Device(this, config.$partitions[i], d));
		this.$gadgets = this.$devices.flatMap(d => d.$gadgets);

		this.$valid = seeded ? true : this._position();
		if(!this.$valid) return;

		// Carefully initialize the positioning of devices in a predictable ordering
		const devicesToInitialize = new Set(this.$devices);
		while(devicesToInitialize.size > 0) {
			for(const device of devicesToInitialize) {
				const c = device.$partition.$displacementReference;
				if(c.e >= 0 || this._getDeviceOfConnection(c).$initialized) {
					device.$init();
					devicesToInitialize.delete(device);
				}
			}
		}
	}

	public toJSON(): JPattern {
		return {
			devices: this.$devices.map(device => device.toJSON()),
		};
	}

	/** Return the actual {@link Point} to which the given {@link JConnection} connects. */
	public $getConnectionTarget(c: JConnection): Point {
		if(c.e >= 0) {
			return new Point(State.$tree.$nodes[c.e as NodeId]!.$AABB.$points[c.q]);
		} else {
			const [i, j] = this.$config.$overlapMap.get(c.e as OverlapId)!;
			return this.$devices[i].$anchors[j][c.q];
		}
	}

	public $tryUpdateOrigin(): void {
		if(!this.$originDirty) return;
		this.$devices.forEach(d => State.$movedDevices.add(d));
		this.$originDirty = false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _position(): boolean {
		const context = new PositioningContext(this);
		const singleMode = this.$config.$singleMode;
		if(!context.$checkJunctions(singleMode)) return false;

		if(singleMode || context.$junctions.length == 1) {
			return singleJunctionPositioner(context);
		}
		/* istanbul ignore else: not implemented yet */
		if(context.$junctions.length == 2) {
			return twoJunctionPositioner(context);
		}
		/* istanbul ignore next: type-safety */
		return false;
	}

	private _getDeviceOfConnection(c: JConnection): Device {
		return this.$devices[this.$config.$overlapMap.get(c.e as OverlapId)![0]];
	}
}
