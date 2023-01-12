import { Container, Graphics, Rectangle } from "pixi.js";
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
import { MARGIN } from "client/screen/constants";
import { ZoomController } from "client/controllers/zoomController";

import type { Control } from "client/base/control";
import type { JSheet } from "shared/json";
import type { IGrid } from "./grid";

const BORDER_WIDTH = 3;
const GRID_WIDTH = 0.25;

const LAYERS = Enum.values(Layer);

//=================================================================
/**
 * {@link Sheet} 是代表一個工作區域。
 */
//=================================================================
export class Sheet extends View implements ISerializable<JSheet> {

	/**
	 * 這個工作區域目前捲動的位置，單位是像素。
	 *
	 * 效能起見，我們將它宣告成 {@link shallowRef}，
	 * 並且利用 {@link Readonly} 來強迫每次都要更換實體。
	 */
	@shallowRef public $scroll: Readonly<IPoint> = { x: 0, y: 0 };

	@shallowRef public $zoom: number = FULL_ZOOM;

	@shallowRef private _type: GridType;

	/** 最上層容器 */
	public readonly $view: Container = new Container();

	/** 圖層 */
	private _layers: Container[] = [];

	/** 紙邊 */
	private _borderGraphics: SmoothGraphics = new SmoothGraphics();

	/** 格線 */
	private _gridGraphics: SmoothGraphics = new SmoothGraphics();

	/** 圖層遮罩 */
	private _mask: Graphics = new Graphics();

	@shallowRef private _grid: IGrid;

	private readonly _controls: Control[] = shallowReactive([]);

	constructor(json?: Partial<JSheet>, parentView?: Container) {
		super();

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
		this._grid = createGrid(this._type, json?.width, json?.height);

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

	public get type(): GridType {
		return this._type;
	}

	public set type(v: GridType) {
		if(v == this._type) return;
		this._grid = createGrid(v, this._grid.$height, this._grid.$width);
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

	public get $controls(): readonly Control[] {
		return this._controls;
	}

	public get $layers(): readonly Container[] {
		return this._layers;
	}

	public $getScale(): number {
		const viewWidth = viewport.width, viewHeight = viewport.height;

		//TODO
		const factor = this.$zoom / FULL_ZOOM;
		// const controls = this._labeledControls, width = ;
		const horizontalScale = (viewWidth - 2 * MARGIN) * factor / this._grid.$width;
		// if(controls.length == 0) return horizontalScale;

		if(app.settings.showLabel) {
			// const views = controls.map(c => ViewService.$get(c) as LabeledView<Control>);
			// const scales = views.map(v =>
			// 	v.$getHorizontalScale(width, viewWidth - 2 * fix, factor)
			// );
			// horizontalScale = Math.min(horizontalScale, ...scales);
		}

		const verticalScale = (viewHeight * factor - MARGIN * 2) / this._grid.$height;
		return Math.min(horizontalScale, verticalScale);
	}

	public get $horizontalMargin(): number {
		// TODO
		return MARGIN;
	}

	/** 整個視圖像素化之後的尺寸 */
	public readonly $imageDimension = computed<IDimension>(() => {
		const s = ProjectService.scale.value;
		const { x, y } = this._grid.$offset;
		const [width, height] = [this._grid.$width, this._grid.$height];
		this.$view.hitArea = new Rectangle(x, y, width + x, height + y);
		return {
			width: (width + x * 2) * s + MARGIN * 2,
			height: (height + y * 2) * s + MARGIN * 2,
		};
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 根據使用者設定來更新圖層的可見性 */
	private _layerVisibility(): void {
		this._layers[Layer.$axisParallels].visible = app.settings.showAxialParallel;
		this._layers[Layer.$dot].visible = app.settings.showDot;
		this._layers[Layer.$hinge].visible = app.settings.showHinge;
		this._layers[Layer.$label].visible = app.settings.showLabel;
		this._layers[Layer.$ridge].visible = app.settings.showRidge;
	}

	/** 根據當前的捲動位置來調整容器的位置 */
	private _positioning(): void {
		const image = this.$imageDimension.value;
		this.$view.x = Math.max((viewport.width - image.width) / 2, 0) - this.$scroll.x + MARGIN;
		this.$view.y = Math.max((viewport.height + image.height) / 2, image.height) - this.$scroll.y - MARGIN;
	}

	/** 繪製框線和格線 */
	private _drawSheet(): void {
		const s = ProjectService.scale.value;
		const sh = ProjectService.shrink.value;
		this.$view.scale.set(s, -s);

		// 繪製邊框
		const color = app.isDark.value ? LIGHT : CHARCOAL;
		this._borderGraphics.clear()
			.lineStyle(
				BORDER_WIDTH * sh,
				app.settings.colorScheme.border ?? color
			);
		this._grid.$drawBorder(this._borderGraphics);

		// 繪製圖層遮罩
		this._mask.clear().beginFill(0);
		this._grid.$drawBorder(this._mask);
		this._mask.endFill();

		// 繪製格線
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
