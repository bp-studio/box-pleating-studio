import { Graphics } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/shared/layers";
import { Control } from "client/base/control";
import { drawContours, drawLines, fillContours } from "client/utils/contourUtil";
import ProjectService from "client/services/projectService";
import { style } from "client/services/styleService";

import type { GraphicsData } from "core/service/updateModel";
import type { Layout } from "./layout";
import type { Edge } from "../tree/edge";

//=================================================================
/**
 * {@link River} is the control for the river.
 */
//=================================================================
export class River extends Control {

	public readonly $tag: string;
	public readonly type = "River";
	public readonly $priority: number = 1;

	public $graphics: GraphicsData;

	public readonly $edge: Edge;
	private readonly _layout: Layout;

	private readonly _shade: Graphics;
	private readonly _hinge: SmoothGraphics;
	private readonly _ridge: SmoothGraphics;


	constructor(layout: Layout, edge: Edge, graphics: GraphicsData) {
		const sheet = layout.$sheet;
		super(sheet);
		this._layout = layout;
		this.$selectedCursor = "pointer";
		this.$tag = edge.$tag.replace("e", "r"); // For debug

		this.$edge = edge;
		this.$graphics = graphics;

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.shade]);
		this._hinge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.hinge]);
		this._ridge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.ridge]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get length(): number {
		return this.$destructed ? 0 : this.$edge.length;
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

	public delete(): Promise<void> {
		return this.$edge.deleteAndMerge();
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
		const { width, color } = style.hinge;
		this._shade.clear();
		fillContours(this._shade, this.$graphics.contours, color);

		const sh = ProjectService.shrink.value;
		this._hinge.clear().lineStyle(width * sh, color);

		// Uncomment the next line for debugging
		// if(this.$selected) this._hinge.lineStyle(width * 2 * sh, 0x66dd66);

		drawContours(this._hinge, this.$graphics.contours);

		this._ridge.clear().lineStyle(style.ridge.width * sh, style.ridge.color);
		drawLines(this._ridge, this.$graphics.ridges);
	}
}
