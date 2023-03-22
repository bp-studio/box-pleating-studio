import { Control } from "client/base/control";
import { Device } from "./device";

import type { JStretch } from "shared/json";
import type { StretchData, UpdateModel } from "core/service/updateModel";
import type { Layout } from "./layout";

//=================================================================
/**
 * {@link Stretch} represents a stretch pattern.
 */
//=================================================================
export class Stretch extends Control implements ISerializable<JStretch> {
	public readonly type = "Stretch";
	public readonly $priority: number = 0;
	private readonly _devices: Device[] = [];
	private _data!: StretchData;
	private _layout: Layout;

	constructor(layout: Layout, data: StretchData, model: UpdateModel) {
		super(layout.$sheet);
		this._layout = layout;
		this.$update(data, model);
	}

	public toJSON(): JStretch {
		return this._data.data;
	}

	public get $devices(): readonly Device[] {
		return this._devices;
	}

	public $update(data: StretchData, model: UpdateModel): void {
		this._data = data;
		const deviceCount = data.data.pattern!.devices.length;
		while(deviceCount < this._devices.length) {
			const device = this._devices.pop()!;
			this._layout.$sheet.$removeChild(device);
			this.$removeChild(device);
			device.$dispose();
		}
		for(let i = 0; i < deviceCount; i++) {
			const device = this._devices[i];
			const graphics = model.graphics["s" + data.data.id + "." + i];
			if(device) {
				device.$redraw(graphics);
			} else {
				this._devices[i] = new Device(this._layout, graphics);
				this._layout.$sheet.$addChild(this._devices[i]);
				this.$addChild(this._devices[i]);
			}
		}
	}
}
