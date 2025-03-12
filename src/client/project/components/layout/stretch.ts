import { Control } from "client/base/control";
import { shallowRef } from "client/shared/decorators";
import { SelectionController } from "client/controllers/selectionController";
import { Device } from "./device";
import { clone } from "shared/utils/clone";

import type { ITagObject } from "client/shared/interface";
import type { JRepository, JStretch, Memento } from "shared/json";
import type { View } from "client/base/view";
import type { DeviceData, UpdateModel } from "core/service/updateModel";
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
	public readonly $ids: number[];
	public readonly type = "Stretch";
	public readonly $priority: number = 0;
	private readonly _devices: Device[] = [];
	@shallowRef private accessor _data!: JStretch;
	public readonly $layout: Layout;

	constructor(layout: Layout, data: JStretch, model: UpdateModel) {
		super(layout.$sheet);
		this.$tag = "s" + data.id;
		this.$ids = data.id.split(",").map(n => Number(n));
		this.$layout = layout;
		this.$update(data, model);
	}

	public toJSON(session?: true): JStretch {
		const result = clone(this._data);
		if(!session) delete result.repo;
		return result;
	}

	public $toMemento(): Memento {
		return [this.$tag, this.toJSON(true)];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get repo(): JRepository | undefined {
		return this._data.repo;
	}

	public get id(): string {
		return this._data.id;
	}

	public get configIndex(): number {
		return this._data.repo?.index ?? 0;
	}
	public set configIndex(v: number) {
		// Since the entire repository is stored in the memo,
		// it suffices to handling config/pattern navigation as field change.
		this.$project.history.$fieldChange(this, "configIndex", this.configIndex, v);
		this._navigate(() => this.$layout.$switchConfig(this.id, v));
	}

	public get patternIndex(): number {
		const repo = this._data.repo;
		if(!repo) return 0;
		return repo.configurations[repo.index].index;
	}
	public set patternIndex(v: number) {
		this.$project.history.$fieldChange(this, "patternIndex", this.patternIndex, v);
		this._navigate(() => this.$layout.$switchPattern(this.id, v));
	}

	public switchConfig(by: number): void {
		const repo = this._data.repo;
		if(!repo) return;
		const i = repo.index;
		const l = repo.configurations.length;
		this.configIndex = (i + by + l) % l;
	}

	public switchPattern(by: number): void {
		const repo = this._data.repo;
		if(!repo) return;
		const config = repo.configurations[repo.index];
		const i = config.index;
		const l = config.patterns.length;
		this.patternIndex = (i + by + l) % l;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Control methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override get $selected(): boolean {
		return super.$selected;
	}
	public override set $selected(v: boolean) {
		super.$selected = v;
		if(v) this.$complete();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $devices(): readonly Device[] {
		return this._devices;
	}

	public $update(data: JStretch, model: UpdateModel): void {
		this._data = data;
		const deviceCount = data.pattern!.devices.length;
		while(deviceCount < this._devices.length) {
			const device = this._devices.pop()!;
			this.$layout.$sheet.$removeChild(device);
			this.$removeChild(device);
			device.$destruct();
		}
		this.$updateGraphics(model, deviceCount);
	}

	public $updateGraphics(model: UpdateModel, deviceCount: number = this.$devices.length): void {
		for(let i = 0; i < deviceCount; i++) {
			const device = this._devices[i];
			const deviceTag = this.$tag + "." + i;
			const graphics = model.graphics[deviceTag] as DeviceData;
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

	/**
	 * Complete the calculation of all stretch patterns when a {@link Stretch} is selected.
	 */
	public async $complete(): Promise<void> {
		// Skip if this is already done.
		if(this._data.repo) return;

		// If the result is null, then the stretch is already deleted,
		// and we can just ignore the result.
		const data = await this.$layout.$completeStretch(this.id);
		if(data) this._data = data;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private async _navigate(navigateFactory: () => Promise<void>): Promise<void> {
		SelectionController.clear();
		SelectionController.$toggle(this, true);
		await navigateFactory();
		if(this._devices.length == 1) {
			SelectionController.clear();
			SelectionController.$toggle(this._devices[0], true);
		}
	}
}
