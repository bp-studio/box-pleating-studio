import { shallowRef } from "client/shared/decorators";
import { View } from "./view";
import { hitMap } from "client/screen/controlEventBoundary";
import { display } from "client/screen/display";

import type { SelectionController } from "client/controllers/selectionController";
import type { Project } from "client/project/project";
import type { ITagObject } from "client/shared/interface";
import type { Sheet } from "client/project/components/sheet";
import type { Container } from "@pixi/display";
import type { IHitArea } from "@pixi/events";

type ControlType = "Flap" | "Vertex" | "River" | "Edge" | "Stretch" | "Device";

//=================================================================
/**
 * {@link Control} is a {@link View} that can be selected.
 */
//=================================================================
export abstract class Control extends View implements ITagObject {

	public abstract readonly $tag: string;
	public readonly $project: Project;

	/**
	 * Return the type string of this object.
	 *
	 * Consider the possibility of mangling the code,
	 * we don't use the name of the constructor here,
	 * and instead ask for the derived classes to implement this field.
	 */
	public abstract readonly type: ControlType;

	/**
	 * The priority of selection. Larger ones go first.
	 * If it is set to infinity, it will force all other {@link Control}s
	 * with finite priority to be unselectable.
	 */
	public abstract readonly $priority: number;

	@shallowRef private accessor _selected: boolean = false;
	@shallowRef private accessor _hovered: boolean = false;

	/** The cursor style to use when the object is selected. */
	public $selectedCursor: string = "move";

	/** The {@link Container} for hit testing. */
	private _hitObject?: Container;

	constructor(sheet: Sheet) {
		super();
		this.$project = sheet.$project;

		sheet.$controls.add(this);
		this._onDestruct(() => sheet.$controls.delete(this));
	}

	/**
	 * Whether the {@link Control} is selected.
	 *
	 * Note that in most cases this property should not be manipulated directly,
	 * but instead use {@link SelectionController} to toggle it.
	 * The only exceptions are the "goToDual" methods.
	 */
	public get $selected(): boolean {
		return this._selected;
	}
	public set $selected(v: boolean) {
		if(this._hitObject) this._hitObject.cursor = v ? this.$selectedCursor : "pointer";
		this._selected = v;
	}

	/** Whether self can be selected together with another {@link Control}. */
	public $selectableWith(c: Control): boolean { return false; }

	/**
	 * Whether self can be reselected after the given {@link Control}.
	 *
	 * When a {@link Flap} is selected, if the user immediately drags on a region
	 * overlapped by the flap and a relevant {@link Device}, such interaction
	 * is not interpreted as dragging the flap, but as dragging the device.
	 * Therefore, when such dragging happens, we need to immediately
	 * select the device instead. Such behavior is known as "reselection".
	 */
	public $reselectableAfter(c: Control): boolean { return false; }

	protected $setupHit(object: Container, hitArea?: IHitArea): void {
		this._hitObject = object;
		hitMap.set(object, this);
		object.eventMode = "static";
		object.cursor = "pointer";
		if(hitArea) object.hitArea = hitArea;
		object.on("mouseenter", () => this._hovered = true);
		object.on("mouseleave", () => this._hovered = false);
		object.on("mousedown", () => display.canvas.style.cursor = this.$selectedCursor);
	}

	protected get $hovered(): boolean {
		return this._hovered;
	}
}
