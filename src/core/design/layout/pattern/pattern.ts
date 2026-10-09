
import { Device } from "./device";
import { Point } from "core/math/geometry/point";
import { State } from "core/service/state";
import { singleJunctionPositioner } from "./positioners/singleJunctionPositioner";
import { hasOverlappingDevices, jointPositioner } from "./positioners/jointPositioner";
import { PositioningContext } from "./positioners/positioningContext";

import type { Gadget } from "./gadget";
import type { JConnection, JDevice, JPattern, NodeId, OverlapId } from "shared/json";
import type { Configuration } from "../configuration";

//=================================================================
/**
 * {@link Pattern} is a complete set of crease pattern for a
 * {@link Configuration}. A {@link Configuration} could have many
 * {@link Pattern}s to choose from.
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
	 * @param seeded Signify that this is a seeded pattern, and positioning is
	 * not needed.
	 */
	constructor(
		config: Configuration, devices: readonly JDevice[], seeded?: boolean
	) {
		this.$config = config;
		this.$devices = devices.map(
			(d, i) => new Device(this, config.$partitions[i], d)
		);
		this.$gadgets = this.$devices.flatMap(d => d.$gadgets);

		this.$valid = seeded ? true : this._position();
		if(!this.$valid) return;

		// Carefully initialize the positioning of devices in a predictable
		// ordering
		const devicesToInitialize = new Set(this.$devices);
		while(devicesToInitialize.size > 0) {
			for(const device of devicesToInitialize) {
				const c = device.$partition.$displacementReference.value;
				if(c.e >= 0 || this._getDeviceOfConnection(c).$initialized) {
					device.$init();
					devicesToInitialize.delete(device);
				}
			}
		}

		// The bridges are placed in the middle of their dragging ranges, which
		// also take the intersection anchors into account.
		if(!seeded) {
			for(const device of this.$devices) {
				if(device.$isBridge) device.$center();
			}
		}

		if(!seeded && this._isJoint && hasOverlappingDevices(this.$devices)) {
			this.$valid = false;
		}
	}

	public toJSON(): JPattern {
		return {
			devices: this.$devices.map(device => device.toJSON()),
		};
	}

	/**
	 * Return the actual {@link Point} to which the given {@link JConnection}
	 * connects.
	 */
	public $getConnectionTarget(c: JConnection): Point {
		if(c.e >= 0) {
			const node = State.m.$tree.$nodes[c.e as NodeId]!;
			return new Point(node.$AABB.$points[c.q]);
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

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	private _position(): boolean {
		const context = new PositioningContext(this);
		const singleMode = this.$config.$singleMode;
		if(!context.$checkJunctions(singleMode)) return false;

		if(!this._isJoint) return singleJunctionPositioner(context);
		// So far, multiple junctions must share a single joint
		return jointPositioner(context);
	}

	/** Whether the pattern is positioned by {@link jointPositioner}. */
	private get _isJoint(): boolean {
		return !this.$config.$singleMode &&
			this.$config.$repo.$junctions.length > 1;
	}

	private _getDeviceOfConnection(c: JConnection): Device {
		const [i] = this.$config.$overlapMap.get(c.e as OverlapId)!;
		return this.$devices[i];
	}
}
