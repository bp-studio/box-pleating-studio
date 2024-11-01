import { computed, h } from "vue";
import { Container } from "@pixi/display";
import { Graphics } from "@pixi/graphics";
import { Rectangle } from "@pixi/math";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import settings from "app/services/settingService";
import { shallowRef } from "client/shared/decorators";
import { View } from "client/base/view";
import { FULL_ZOOM, MARGIN } from "client/shared/constant";
import ProjectService from "client/services/projectService";
import { display } from "client/screen/display";
import { Enum } from "client/shared/enum";
import { Layer, LayerOptions } from "client/shared/layers";
import { GridType } from "shared/json";
import { createGrid } from "./grid";
import { ZoomController } from "client/controllers/zoomController";
import { style } from "client/services/styleService";
import { $round } from "client/controllers/share";

import type { TransformationMatrix } from "shared/types/geometry";
import type { ComputedRef } from "vue";
import type { Grid } from "./grid/grid";
import type { ITagObject } from "client/shared/interface";
import type { Independent } from "client/base/independent";
import type { Project } from "../project";
import type { Control } from "client/base/control";
import type { DesignMode, JSheet, JViewport, Memento } from "shared/json";

const LAYERS = Enum.values(Layer);

/** {@link IEditor} is the associated editing logic for a {@link Sheet}. */
export interface IEditor {
	$transform(matrix: TransformationMatrix): void;
}

//=================================================================
/**
 * {@link Sheet} represents a working area.
 */
//=================================================================
export class Sheet extends View implements ISerializable<JSheet>, ITagObject {

	public readonly $tag: DesignMode;

	/**
	 * The current scrolling position of this working area, in pixels.
	 *
	 * We made it {@link shallowRef} for better performance,
	 * and use {@link Readonly} to ensure that we use different instances each time.
	 */
	@shallowRef public accessor $scroll: IPoint = { x: 0, y: 0 };

	@shallowRef public accessor $zoom: number = FULL_ZOOM;

	@shallowRef private accessor _type: GridType;

	@shallowRef private accessor _grid: Grid;

	/** Top-level container */
	public readonly $view: Container = new Container();

	/** The project to which it belongs. */
	public readonly $project: Project;

	public readonly $controls: Set<Control> = new Set();

	public readonly $independents: Set<Independent> = new Set();

	/** The layers. */
	private _layers: Container[] = [];

	/** The border of the sheet. */
	private _borderGraphics: SmoothGraphics = new SmoothGraphics();

	/** The grid lines. */
	private _gridGraphics: SmoothGraphics = new SmoothGraphics();

	/** The mask for the clipped layers. */
	private _mask: Graphics = new Graphics();

	private readonly _editor: IEditor;

	constructor(
		project: Project, parentView: Container,
		tag: DesignMode, editor: IEditor,
		json?: JSheet, state?: JViewport
	) {
		super();
		this.$project = project;
		this.$tag = tag;
		this._editor = editor;

		if(state) {
			this.$zoom = state.zoom;
			this.$scroll = state.scroll;
		}

		this.$addRootObject(this.$view, parentView);
		for(const layer of LAYERS) {
			const container = new Container();
			this._layers[layer] = container;
			if(!LayerOptions[layer].interactive) container.interactiveChildren = false;
			if(LayerOptions[layer].clipped) container.mask = this._mask;
		}
		this.$view.addChild(this._mask, ...this._layers);

		this._layers[Layer.sheet].addChild(this._borderGraphics, this._gridGraphics);

		this._type = json?.type ?? GridType.rectangular;
		this._grid = createGrid(this, this._type, json?.width, json?.height);

		// Computed no longer requires effect scope since Vue 3.5
		this.$imageDimension = computed(() => this._imageDimension);

		this.$reactDraw(this._drawSheet, this._positioning, this._layerVisibility);

		this._onDestruct(() => {
			// GC
			this._grid.$destruct();
			this._grid = null!;
		});
	}

	public toJSON(): JSheet {
		return this._grid.toJSON();
	}

	public $getViewport(): JViewport {
		return {
			zoom: this.$zoom,
			scroll: this.$scroll,
		};
	}

	public $clearSelection(): void {
		for(const c of this.$controls) c.$selected = false;
	}

	public $getSelectedTags(): string[] {
		const result: string[] = [];
		for(const c of this.$controls) if(c.$selected) result.push(c.$tag);
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get type(): GridType {
		return this._type;
	}
	public set type(v: GridType) {
		const oldValue = this._type;
		if(v == oldValue) return;
		const history = this.$project.history;
		const locked = history.$isLocked;
		let grid: Grid;
		if(locked) {
			const prototype = this.$project.design.$prototype[this.$tag].sheet;
			grid = createGrid(this, v, prototype.width, prototype.height);
		} else {
			history.$destruct(this._toMemento());
			grid = createGrid(this, v, this._grid.$renderHeight, this._grid.$renderWidth);
		}

		// Due to the possible flap moving, the actual switching of grid will have
		// to wait until the updates are complete, otherwise there will be glitches.
		this.$project.$onUpdate(() => {
			this._grid = grid;
			this._type = v;
			if(!locked) {
				history.$construct(this._toMemento());
				history.$fieldChange(this, "type", oldValue, v);
			}
		});
	}

	public get grid(): Grid {
		return this._grid;
	}

	public get zoom(): number {
		return this.$zoom;
	}
	public set zoom(v: number) {
		if(v < FULL_ZOOM) v = FULL_ZOOM;
		ZoomController.$zoom(v, this);
	}

	public get $layers(): readonly Container[] {
		return this._layers;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Logics
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $getScale(): number {
		const viewWidth = display.viewport.width;
		const viewHeight = display.viewport.height;
		const factor = this.$zoom / FULL_ZOOM;
		const horizontalScale = (viewWidth - 2 * MARGIN) * factor / this._grid.$renderWidth;
		const verticalScale = (viewHeight * factor - MARGIN * 2) / this._grid.$renderHeight;
		return Math.min(horizontalScale, verticalScale);
	}

	public subdivide(): void {
		display.shield(async () => {
			const oldCenter = this.grid.$getResizeCenter();
			this.grid.$setDimension(this.grid.$renderWidth * 2, this.grid.$renderHeight * 2);
			const newCenter = this.grid.$getResizeCenter();
			this._editor.$transform([2, 0, 0, 2, newCenter.x - 2 * oldCenter.x, newCenter.y - 2 * oldCenter.y]);
			await this.$project.design.$batchUpdateManager.$updateComplete;
		});
	}

	public rotate(by: Sign): void {
		display.shield(async () => {
			const oldCenter = this.grid.$getCenter();
			const { width, height } = this.grid.toJSON();
			this.grid.$setDimension(height, width);
			const newCenter = this.grid.$getCenter();
			this._editor.$transform([0, by, -by, 0, newCenter.x - by * oldCenter.y, newCenter.y + by * oldCenter.x]);
			await this.$project.design.$batchUpdateManager.$updateComplete;
		});
	}

	public flip(horizontal: boolean): void {
		display.shield(async () => {
			const { x, y } = this.grid.$getCenter();
			this._editor.$transform(horizontal ? [-1, 0, 0, 1, 2 * x, 0] : [1, 0, 0, -1, 0, 2 * y]);
			await this.$project.design.$batchUpdateManager.$updateComplete;
		});
	}

	/** The dimension of the sheet after rasterization. */
	declare public readonly $imageDimension: ComputedRef<IDimension>;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private get _imageDimension(): IDimension {
		const s = ProjectService.scale.value;
		const { x, y } = this._grid.$offset;
		const hitMargin = 0.5; // Extra margin is needed, or the vertices on the boundary will be difficult to click
		const [width, height] = [this._grid.$renderWidth, this._grid.$renderHeight];
		this.$view.hitArea = new Rectangle(
			x - hitMargin, y - hitMargin, width + x + 2 * hitMargin, height + y + 2 * hitMargin
		);
		return {
			width: (width + x * 2) * s + MARGIN * 2,
			height: (height + y * 2) * s + MARGIN * 2,
		};
	}

	private _toMemento(): Memento {
		return [this.$tag, this.toJSON()];
	}

	/** Toggle layer visibility by user settings. */
	private _layerVisibility(): void {
		this._layers[Layer.axisParallels].visible = settings.display.axialParallel;
		this._layers[Layer.dot].visible = settings.display.dot;
		this._layers[Layer.hinge].visible = settings.display.hinge;
		this._layers[Layer.label].visible = settings.display.label;
		this._layers[Layer.ridge].visible = settings.display.ridge;
	}

	/** Adjust the position of the container by the scrolling position. */
	private _positioning(): void {
		const image = this.$imageDimension.value;
		const vp = display.viewport;
		this.$view.x = Math.max((vp.width - image.width) / 2, 0) - this.$scroll.x + MARGIN;
		this.$view.y = Math.max((vp.height + image.height) / 2, image.height) - this.$scroll.y - MARGIN;
	}

	/** Draw the border and grid lines. */
	private _drawSheet(): void {
		const s = ProjectService.scale.value;
		const sh = ProjectService.shrink.value;
		this.$view.scale.set(s, -s);

		// Draw border
		this._borderGraphics.clear()
			.lineStyle(style.border.width * sh, style.border.color);
		this._grid.$drawBorder(this._borderGraphics);

		// Draw layer mask
		this._mask.clear().beginFill(0);
		this._grid.$drawBorder(this._mask);
		this._mask.endFill();

		// Draw grid lines
		this._gridGraphics.visible = settings.display.grid;
		if(this._gridGraphics.visible) {
			this._gridGraphics.clear()
				.lineStyle(style.grid.width * sh, style.grid.color);
			this._grid.$drawGrid(this._gridGraphics);
		}
	}
}

export function getRelativePoint(point: IPoint, fromSheet: Sheet, toSheet: Sheet): IPoint {
	const fromGrid = fromSheet.grid, toGrid = toSheet.grid;
	const xFactor = toGrid.$renderWidth / fromGrid.$renderWidth;
	const yFactor = toGrid.$renderHeight / fromGrid.$renderHeight;
	const p: IPoint = $round({ x: point.x * xFactor, y: point.y * yFactor });
	return toGrid.$constrain(p);
}
