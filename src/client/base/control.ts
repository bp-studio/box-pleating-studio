import { shallowRef } from "client/shared/decorators";
import { View } from "./view";

import type { Sheet } from "client/project/components/sheet";
import type { Container, DisplayObject } from "@pixi/display";
import type { IHitArea } from "@pixi/events";

//=================================================================
/**
 * {@link Control} is a {@link View} that can be selected.
 */
//=================================================================
export abstract class Control extends View {

	/**
	 * Return the type string of this object.
	 *
	 * Consider the possibility of mangling the code,
	 * we don't use the name of the constructor here,
	 * and instead ask for the derived classes to implement this field.
	 */
	public abstract readonly type: string;

	/**
	 * The priority of selection. Larger ones go first.
	 * If it is set to infinity, it will force all other {@link Control}s
	 * with finite priority to be unselectable.
	 */
	public abstract readonly $priority: number;

	@shallowRef public $selected: boolean = false;
	@shallowRef private _hovered: boolean = false;

	constructor(sheet: Sheet) {
		super();

		sheet.$controls.add(this);
		this._onDispose(() => sheet.$controls.delete(this));
	}

	/** Whether self can be selected together with another {@link Control}. */
	public $selectableWith(c: Control): boolean { return false; }

	protected $setupHit(object: Container, hitArea?: IHitArea): void {
		Control._hitMap.set(object, this);
		object.interactive = true;
		object.cursor = "pointer";
		if(hitArea) object.hitArea = hitArea;
		object.on("mouseenter", () => this._hovered = true);
		object.on("mouseleave", () => this._hovered = false);
	}

	protected get $hovered(): boolean {
		return this._hovered;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Static members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private static _hitMap: WeakMap<DisplayObject, Control> = new WeakMap();

	public static $getHitControl(object: DisplayObject): Control | undefined {
		return Control._hitMap.get(object);
	}
}
