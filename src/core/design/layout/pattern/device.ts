import { Gadget } from "./gadget";

import type { JDevice } from "shared/json";
import type { Pattern } from "./pattern";

//=================================================================
/**
 * {@link Device} is the smallest movable unit in a {@link Pattern}.
 */
//=================================================================
export class Device implements ISerializable<JDevice> {

	public $gadgets: readonly Gadget[];

	constructor(data: JDevice) {
		this.$gadgets = data.gadgets.map(g => new Gadget(g));
	}

	public toJSON(): JDevice {
		return {
			gadgets: this.$gadgets,
		};
	}
}
