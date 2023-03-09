
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

	//TODO
	public $valid: boolean = true;

	private _devices: readonly Device[];

	constructor(devices: JDevice[]) {
		this._devices = devices.map(d => new Device(d));
	}

	public toJSON(): JPattern {
		return {
			devices: this._devices.map(d => d.toJSON()),
		};
	}
}
