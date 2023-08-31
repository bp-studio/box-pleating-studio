
import { Graphics } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/shared/layers";
import { drawLines, fillContours } from "client/utils/contourUtil";
import ProjectService from "client/services/projectService";
import { style } from "client/services/styleService";
import { Draggable } from "client/base/draggable";

import type { Stretch } from "./stretch";
import type { DeviceData } from "core/service/updateModel";

//=================================================================
/**
 * {@link Device} is the control for a single device in a stretch pattern.
 */
//=================================================================
export class Device extends Draggable {

	public readonly $tag: string;
	public readonly type = "Device";
	public readonly $priority: number = 2;

	public $graphics: DeviceData;

	public readonly stretch: Stretch;
	public readonly $index: number;

	private readonly _shade: Graphics;
	private readonly _ridge: SmoothGraphics;
	private readonly _axisParallels: SmoothGraphics;


	constructor(stretch: Stretch, index: number, graphics: DeviceData) {
		const sheet = stretch.$layout.$sheet;
		super(sheet);
		this.$tag = stretch.$tag + "." + index;
		this.$index = index;
		this.stretch = stretch;

		this.$graphics = graphics;
		this.$selectedCursor = graphics.forward ? "nesw-resize" : "nwse-resize"; // Should be a one-time setup in theory.
		this.$location = graphics.location;

		// We deliberately put the shade on a higher layer,
		// so that its hovering effect can be prioritized.
		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.edge]);
		this._ridge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.ridge]);
		this._axisParallels = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.axisParallels]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Control methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $constrainBy(v: IPoint): IPoint {
		const f = this.$graphics.forward ? 1 : -1;
		let dx = Math.round((v.x + f * v.y) / 2);
		const range = this.$graphics.range;
		if(dx < range[0]) dx = range[0];
		if(dx > range[1]) dx = range[1];
		return { x: dx, y: f * dx };
	}

	protected override async _move(x: number, y: number): Promise<void> {
		const dx = x - this.$location.x;
		await super._move(x, y);

		// Update range, so that subsequent dragging can be constraint correctly even before redraw.
		const r = this.$graphics.range;
		this.$graphics.range = [r[0] - dx, r[1] - dx];

		await this.stretch.$layout.$moveDevice(this);
	}

	public override get $selected(): boolean {
		return super.$selected;
	}
	public override set $selected(v: boolean) {
		super.$selected = v;
		if(v) this.stretch.$complete();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $redraw(data: DeviceData): void {
		this.$graphics = data;
		this.$location = data.location; // This is needed during navigation
		this._draw();
	}

	private _drawShade(): void {
		this._shade.alpha = style.shade.alpha;
		if(this.$selected || this.stretch.$selected) this._shade.alpha = style.shade.alpha;
		else if(this.$hovered) this._shade.alpha = style.shade.hover;
		else this._shade.alpha = 0;
	}

	private _draw(): void {
		this._shade.clear();
		fillContours(this._shade, this.$graphics.contours, style.hinge.color);

		const sh = ProjectService.shrink.value;
		this._axisParallels.clear().lineStyle(style.axisParallel.width * sh, style.axisParallel.color);
		drawLines(this._axisParallels, this.$graphics.axisParallel);

		this._ridge.clear().lineStyle(style.ridge.width * sh, style.ridge.color);
		drawLines(this._ridge, this.$graphics.ridges);
	}
}
