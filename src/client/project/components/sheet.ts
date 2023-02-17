import { Container } from "@pixi/display";
import { Graphics } from "@pixi/graphics";
import { Rectangle } from "@pixi/math";
import { computed, shallowReactive } from "vue";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { shallowRef } from "client/shared/decorators";
import { View } from "client/base/view";
import { FULL_ZOOM, CHARCOAL, LIGHT } from "client/shared/constant";
import ProjectService from "client/services/projectService";
import { viewport } from "client/screen/display";
import { Enum } from "client/types/enum";
import { Layer, LayerOptions } from "client/types/layers";
import { GridType } from "shared/json";
import { createGrid } from "./grid";
import { MARGIN, MARGIN_FIX } from "client/screen/constants";
import { ZoomController } from "client/controllers/zoomController";

import type { Independent } from "client/base/independent";
import type { Project } from "../project";
import type { Control } from "client/base/control";
import type { Label } from "client/screen/label";
import type { JSheet } from "shared/json";
import type { IGrid } from "./grid";

const BORDER_WIDTH = 3;
const GRID_WIDTH = 0.25;

const LAYERS = Enum.values(Layer);

//=================================================================
/**
 * {@link Sheet} represents a working area.
 */
//=================================================================
export class Sheet extends View implements ISerializable<JSheet> {

	/**
	 * The current scrolling position of this working area, in pixels.
	 *
	 * We made it {@link shallowRef} for better performance,
	 * and use {@link Readonly} to ensure that we use different instances each time.
	 */
	@shallowRef public $scroll: Readonly<IPoint> = { x: 0, y: 0 };

	@shallowRef public $zoom: number = FULL_ZOOM;

	@shallowRef private _type: GridType;

	/** Top-level container */
	public readonly $view: Container = new Container();

	/** The project to which it belongs. */
	protected readonly $project: Project;

	/** The layers. */
	private _layers: Container[] = [];

	/** The border of the sheet. */
	private _borderGraphics: SmoothGraphics = new SmoothGraphics();

	/** The grid lines. */
	private _gridGraphics: SmoothGraphics = new SmoothGraphics();

	/** The mask for the clipped layers. */
	private _mask: Graphics = new Graphics();

	@shallowRef private _grid: IGrid;

	public readonly $controls: Set<Control> = new Set();

	public readonly $independents: Set<Independent> = new Set();

	public readonly $labels: Set<Label> = shallowReactive(new Set());

	constructor(project: Project, parentView: Container, json: JSheet) {
		super();
		this.$project = project;

		this.$addRootObject(this.$view, parentView);
		for(const layer of LAYERS) {
			const container = new Container();
			this._layers[layer] = container;
			if(!LayerOptions[layer].interactive) container.interactiveChildren = false;
			if(LayerOptions[layer].clipped) container.mask = this._mask;
		}
		this.$view.addChild(this._mask, ...this._layers);

		this._layers[Layer.$sheet].addChild(this._borderGraphics, this._gridGraphics);

		this._type = json?.type ?? GridType.rectangular;
		this._grid = createGrid(this, this._type, json?.width, json?.height);

		this.$reactDraw(this._drawSheet, this._positioning, this._layerVisibility);

		if(DEBUG_ENABLED) {
			for(const layer of LAYERS) {
				this._layers[layer].name = "Layer " + Layer[layer];
			}
			this._borderGraphics.name = "Border";
			this._gridGraphics.name = "Grid";
			this._mask.name = "Mask";
		}
	}

	public toJSON(): JSheet {
		return this._grid.toJSON();
	}

	public $clearSelection(): void {
		for(const c of this.$controls) c.$selected = false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get type(): GridType {
		return this._type;
	}
	public set type(v: GridType) {
		if(v == this._type) return;
		this._grid = createGrid(this, v, this._grid.$renderHeight, this._grid.$renderWidth);
		this._type = v;
	}

	public get grid(): IGrid {
		return this._grid;
	}

	public get zoom(): number {
		return this.$zoom;
	}
	public set zoom(v: number) {
		if(v < FULL_ZOOM) v = FULL_ZOOM;
		ZoomController.$zoom(v);
	}

	public get $layers(): readonly Container[] {
		return this._layers;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Logics
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $getScale(): number {
		const viewWidth = viewport.width, viewHeight = viewport.height;

		const factor = this.$zoom / FULL_ZOOM, width = this._grid.$renderWidth;
		let horizontalScale = (viewWidth - 2 * MARGIN) * factor / width;
		if(app.settings.showLabel) {
			const vw = viewWidth * factor - 2 * MARGIN_FIX;
			const scales = [...this.$labels].map(label =>
				label.$inferHorizontalScale(width, vw)
			).filter(s => !isNaN(s));
			horizontalScale = Math.min(horizontalScale, ...scales);
		}

		const verticalScale = (viewHeight * factor - MARGIN * 2) / this._grid.$renderHeight;
		return Math.min(horizontalScale, verticalScale);
	}

	/** Horizontal margin by the actual rendered result. */
	public readonly $horizontalMargin = computed(() => {
		const overflows = [...this.$labels].map(l => l.$overflow);
		const result = Math.max(MARGIN, ...overflows);
		return result;
	});

	/** The dimension of the sheet after rasterization. */
	public readonly $imageDimension = computed<IDimension>(() => {
		const s = ProjectService.scale.value;
		const { x, y } = this._grid.$offset;
		const hitMargin = 0.5; // Extra margin is needed, or the vertices on the boundary will be difficult to click
		const [width, height] = [this._grid.$renderWidth, this._grid.$renderHeight];
		this.$view.hitArea = new Rectangle(
			x - hitMargin, y - hitMargin, width + x + 2 * hitMargin, height + y + 2 * hitMargin
		);
		return {
			width: (width + x * 2) * s + this.$horizontalMargin.value * 2,
			height: (height + y * 2) * s + MARGIN * 2,
		};
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Toggle layer visibility by user settings. */
	private _layerVisibility(): void {
		this._layers[Layer.$axisParallels].visible = app.settings.showAxialParallel;
		this._layers[Layer.$dot].visible = app.settings.showDot;
		this._layers[Layer.$hinge].visible = app.settings.showHinge;
		this._layers[Layer.$label].visible = app.settings.showLabel;
		this._layers[Layer.$ridge].visible = app.settings.showRidge;
	}

	/** Adjust the position of the container by the scrolling position. */
	private _positioning(): void {
		const image = this.$imageDimension.value;
		this.$view.x = Math.max((viewport.width - image.width) / 2, 0) - this.$scroll.x + this.$horizontalMargin.value;
		this.$view.y = Math.max((viewport.height + image.height) / 2, image.height) - this.$scroll.y - MARGIN;
	}

	/** Draw the border and grid lines. */
	private _drawSheet(): void {
		const s = ProjectService.scale.value;
		const sh = ProjectService.shrink.value;
		this.$view.scale.set(s, -s);

		// Draw border
		const color = app.isDark.value ? LIGHT : CHARCOAL;
		this._borderGraphics.clear()
			.lineStyle(
				BORDER_WIDTH * sh,
				app.settings.colorScheme.border ?? color
			);
		this._grid.$drawBorder(this._borderGraphics);

		// Draw layer mask
		this._mask.clear().beginFill(0);
		this._grid.$drawBorder(this._mask);
		this._mask.endFill();

		// Draw grid lines
		this._gridGraphics.visible = app.settings.showGrid;
		if(this._gridGraphics.visible) {
			this._gridGraphics.clear()
				.lineStyle(
					GRID_WIDTH * sh,
					app.settings.colorScheme.grid ?? color
				);
			this._grid.$drawGrid(this._gridGraphics);
		}
	}
}
