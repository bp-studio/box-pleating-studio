
import { Graphics } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/shared/layers";
import { Control } from "client/base/control";
import { drawLines, fillContours } from "client/utils/contourUtil";
import ProjectService from "client/services/projectService";
import { style } from "client/services/styleService";

import type { GraphicsData } from "core/service/updateModel";
import type { Layout } from "./layout";
import type { Edge } from "../tree/edge";

//=================================================================
/**
 * {@link Device} is the control for a single device in a stretch pattern.
 */
//=================================================================
export class Device extends Control {

	public readonly type = "Device";
	public readonly $priority: number = 2;

	public $graphics: GraphicsData;

	private readonly _layout: Layout;

	private readonly _shade: Graphics;
	private readonly _ridge: SmoothGraphics;
	private readonly _axisParallels: SmoothGraphics;


	constructor(layout: Layout, graphics: GraphicsData) {
		const sheet = layout.$sheet;
		super(sheet);
		this._layout = layout;

		this.$graphics = graphics;

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.$shade]);
		this._ridge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$ridge]);
		this._axisParallels = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$axisParallels]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $redraw(data: GraphicsData): void {
		this.$graphics = data;
		this._draw();
	}

	private _drawShade(): void {
		if(this.$selected) this._shade.alpha = style.shade.alpha;
		else if(this.$hovered) this._shade.alpha = style.shade.hover;
		else this._shade.alpha = 0;
	}

	private _draw(): void {
		this._shade.clear();
		fillContours(this._shade, this.$graphics.contours, style.hinge.color);

		const sh = ProjectService.shrink.value;
		this._axisParallels.clear().lineStyle(style.axisParallel.width * sh, style.axisParallel.color);
		drawLines(this._axisParallels, this.$graphics.axisParallel!);

		this._ridge.clear().lineStyle(style.ridge.width * sh, style.ridge.color);
		drawLines(this._ridge, this.$graphics.ridges);
	}
}
