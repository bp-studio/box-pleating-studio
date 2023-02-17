import { Graphics } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import { Control } from "client/base/control";
import { drawContours, fillContours } from "client/screen/contourUtil";
import ProjectService from "client/services/projectService";

import type { Layout } from "./layout";
import type { Edge } from "../tree/edge";
import type { Contour } from "shared/types/geometry";

export const HINGE_WIDTH = 2.5;
export const HINGE_COLOR = 0x6699FF;
export const SHADE_ALPHA = 0.3;
export const SHADE_HOVER = 0.15;
export const RIDGE_WIDTH = 1.25;

//=================================================================
/**
 * {@link River} is the control for the river.
 */
//=================================================================
export class River extends Control {

	public readonly type = "River";
	public readonly $priority: number = 1;

	@shallowRef public $contours: Contour[];

	public readonly $edge: Edge;
	private readonly _layout: Layout;

	private readonly _shade: Graphics;
	private readonly _hinge: SmoothGraphics;


	constructor(layout: Layout, edge: Edge, contours: Contour[]) {
		const sheet = layout.$sheet;
		super(sheet);
		this._layout = layout;

		this.$edge = edge;
		this.$contours = contours;

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.$shade]);
		this._hinge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$hinge]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade);

		if(DEBUG_ENABLED) this._hinge.name = "River Hinge";
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get length(): number {
		return this.$edge.length;
	}
	public set length(v: number) {
		this.$edge.length = v;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public goToDual(): void {
		this._layout.$goToDual(this);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _drawShade(): void {
		if(this.$selected) this._shade.alpha = SHADE_ALPHA;
		else if(this.$hovered) this._shade.alpha = SHADE_HOVER;
		else this._shade.alpha = 0;
	}

	private _draw(): void {
		const color = app.settings.colorScheme.hinge ?? HINGE_COLOR;
		this._shade.clear();
		fillContours(this._shade, this.$contours, HINGE_COLOR);

		const sh = ProjectService.shrink.value;
		this._hinge.clear().lineStyle(HINGE_WIDTH * sh, color);
		drawContours(this._hinge, this.$contours);
	}
}
