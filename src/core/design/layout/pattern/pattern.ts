
import { Device } from "./device";

import type { JDevice, JPattern } from "shared/json";
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

	public $devices: readonly Device[];

	constructor(config: Configuration, devices: JDevice[]) {
		this.$config = config;
		this.$devices = devices.map(d => new Device(this, d));
	}

	public toJSON(): JPattern {
		return {
			devices: this.$devices.map(d => d.toJSON()),
		};
	}
}
