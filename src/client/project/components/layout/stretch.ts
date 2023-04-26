import { Control } from "client/base/control";
import { shallowRef } from "client/shared/decorators";
import { SelectionController } from "client/controllers/selectionController";
import { Device } from "./device";

import type { ITagObject } from "client/shared/interface";
import type { JStretch } from "shared/json";
import type { View } from "client/base/view";
import type { JRepository, StretchData, UpdateModel } from "core/service/updateModel";
import type { Layout } from "./layout";

//=================================================================
/**
 * {@link Stretch} represents a stretch pattern.
 *
 * It inherits {@link Control} which in turns inherits {@link View},
 * but it does not have its own graphics rendering.
 */
//=================================================================
export class Stretch extends Control implements ISerializable<JStretch> {
	public readonly $tag: string;
	public readonly type = "Stretch";
	public readonly $priority: number = 0;
	private readonly _devices: Device[] = [];
	@shallowRef private _data!: StretchData;
	public readonly $layout: Layout;

	constructor(layout: Layout, data: StretchData, model: UpdateModel) {
		super(layout.$sheet);
		this.$tag = "s" + data.data.id;
		this.$layout = layout;
		this.$update(data, model);
	}

	public toJSON(): JStretch {
		return this._data.data;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get repo(): JRepository | undefined {
		return this._data.repo;
	}

	public get id(): string {
		return this._data.data.id;
	}

	public switchConfig(by: number): void {
		const repo = this._data.repo;
		if(!repo) return;
		const i = repo.configIndex;
		const l = repo.configCount;
		//TODO: need to consider history here
		SelectionController.clear();
		SelectionController.$toggle(this, true);
		this.$layout.$switchConfig(this.id, (i + by + l) % l);
	}

	public switchPattern(by: number): void {
		const repo = this._data.repo;
		if(!repo) return;
		const i = repo.patternIndex;
		const l = repo.patternCount;
		//TODO: need to consider history here
		SelectionController.clear();
		SelectionController.$toggle(this, true);
		this.$layout.$switchPattern(this.id, (i + by + l) % l);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $devices(): readonly Device[] {
		return this._devices;
	}

	public $update(data: StretchData, model: UpdateModel): void {
		this._data = data;
		const deviceCount = data.data.pattern!.devices.length;
		while(deviceCount < this._devices.length) {
			const device = this._devices.pop()!;
			this.$layout.$sheet.$removeChild(device);
			this.$removeChild(device);
			device.$dispose();
		}
		for(let i = 0; i < deviceCount; i++) {
			const device = this._devices[i];
			const deviceTag = this.$tag + "." + i;
			const graphics = model.graphics[deviceTag];
			if(device) {
				device.$redraw(graphics);
			} else {
				this._devices[i] = new Device(this, i, graphics);
				this.$layout.$sheet.$addChild(this._devices[i]);
				this.$addChild(this._devices[i]);
			}
		}
	}

	public $query(id: string): ITagObject {
		if(!id) return this;
		return this._devices[parseInt(id)];
	}
}
