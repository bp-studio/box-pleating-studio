import { shallowRef } from "vue";
import { GridType } from "shared/json/enum";
import { Direction } from "shared/types/direction";
import { Grid } from "./grid";
import { MAX_SHEET_SIZE, MIN_RECT_SIZE } from "shared/types/constants";
import { rectangularConstrain } from "./constrain";

import type { Path, TransformationMatrix } from "shared/types/geometry";
import type { GraphicsLike } from "client/utils/contourUtil";
import type { JSheet } from "shared/json";
import type { Sheet } from "../sheet";

const DEFAULT_SIZE = 16;

//=================================================================
/**
 * {@link RectangularGrid} is the most basic grid.
 */
//=================================================================

export class RectangularGrid extends Grid {

	private _testWidth: number;
	private _testHeight: number;

	private readonly _width = shallowRef(0);
	private readonly _height = shallowRef(0);

	constructor(sheet: Sheet, width?: number, height?: number) {
		super(sheet, GridType.rectangular);
		this._testHeight = this._height.value = height ?? DEFAULT_SIZE;
		this._testWidth = this._width.value = width ?? DEFAULT_SIZE;
	}

	public toJSON(): JSheet {
		return {
			type: this.type,
			height: this._height.value,
			width: this._width.value,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get diameter(): number {
		return Math.max(this._height.value, this._width.value);
	}

	public get height(): number {
		return this._height.value;
	}
	public set height(v: number) {
		if(this.$project.history.$isLocked) {
			this._testHeight = this._height.value = v;
			return;
		}

		let flush = true;
		const oldValue = this._height.value;
		if(v < MIN_RECT_SIZE || v > MAX_SHEET_SIZE || oldValue === v) return;
		this._testHeight = v;
		if(v < oldValue) {
			const [min, max] = this._ySpan;
			if(max - min > v) {
				this._testHeight = oldValue;
				return;
			} else if(max > v) {
				this._shift({ x: 0, y: v - max });
				flush = false;
			}
		}
		this._height.value = v;
		this.$project.history.$fieldChange(this, "height", oldValue, v, flush);
	}

	public get width(): number {
		return this._width.value;
	}
	public set width(v: number) {
		if(this.$project.history.$isLocked) {
			this._testWidth = this._width.value = v;
			return;
		}

		let flush = true;
		const oldValue = this._width.value;
		if(v < MIN_RECT_SIZE || v > MAX_SHEET_SIZE || oldValue === v) return;
		this._testWidth = v;
		if(v < oldValue) {
			const [min, max] = this._xSpan;
			if(max - min > v) {
				this._testWidth = oldValue;
				return;
			} else if(max > v) {
				this._shift({ x: v - max, y: 0 });
				flush = false;
			}
		}
		this._width.value = v;
		this.$project.history.$fieldChange(this, "width", oldValue, v, flush);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $canSubdivide(): boolean {
		return this._width.value * 2 <= MAX_SHEET_SIZE && this._height.value * 2 <= MAX_SHEET_SIZE;
	}

	public override $getResizeCenter(): IPoint {
		return { x: 0, y: 0 };
	}

	public override $getCenter(): IPoint {
		return { x: this._width.value / 2, y: this._height.value / 2 };
	}

	public override $setDimension(width: number, height: number): void {
		const w = this._width.value;
		const h = this._height.value;
		this._testWidth = this._width.value = width;
		this._testHeight = this._height.value = height;
		this.$project.history.$fieldChange(this, "width", w, width, false);
		this.$project.history.$fieldChange(this, "height", h, height, false);
	}

	public override $fixDimension(d: IDimension): void {
		if(d.height < MIN_RECT_SIZE) d.height = MIN_RECT_SIZE;
		if(d.width < MIN_RECT_SIZE) d.width = MIN_RECT_SIZE;
	}

	public $constrain(p: IPoint): IPoint {
		return rectangularConstrain(this._width.value, this._height.value, p);
	}

	public $contains(p: IPoint): boolean {
		const { x, y } = p;
		const w = this._testWidth, h = this._testHeight;
		return 0 <= x && x <= w && 0 <= y && y <= h;
	}

	public $getLabelDirection(x: number, y: number): Direction {
		const w = this._width.value, h = this._height.value;
		if(x == 0) {
			if(y == 0) return Direction.LL;
			if(y == h) return Direction.UL;
			return Direction.L;
		}
		if(x == w) {
			if(y == 0) return Direction.LR;
			if(y == h) return Direction.UR;
			return Direction.R;
		}
		if(y == h) return Direction.T;
		return Direction.B;
	}

	public $drawBorder(border: GraphicsLike): void {
		border.drawRect(0, 0, this._width.value, this._height.value);
	}

	public $getBorderPath(): Path {
		const w = this._width.value, h = this._height.value;
		return [
			{ x: 0, y: 0 },
			{ x: w, y: 0 },
			{ x: w, y: h },
			{ x: 0, y: h },
		];
	}

	public $drawGrid(grid: GraphicsLike): void {
		for(let i = 1; i < this._height.value; i++) {
			grid.moveTo(0, i);
			grid.lineTo(this._width.value, i);
		}
		for(let i = 1; i < this._width.value; i++) {
			grid.moveTo(i, 0);
			grid.lineTo(i, this._height.value);
		}
	}

	public $getTransformMatrix(size: number, reorient: boolean): TransformationMatrix {
		const w = this._width.value, h = this._height.value;
		const max = Math.max(w, h);
		const s = size / max;
		return [s, 0, 0, -s, -s * w / 2, s * h / 2];
	}

	public readonly $offset: IPoint = { x: 0, y: 0 };

	public get $renderHeight(): number {
		return this._height.value;
	}

	public get $renderWidth(): number {
		return this._width.value;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private get _xSpan(): [number, number] {
		const anchors = this._anchors();
		const xs = anchors.map(p => p.x);
		return [Math.min(...xs), Math.max(...xs)];
	}

	private get _ySpan(): [number, number] {
		const anchors = this._anchors();
		const ys = anchors.map(p => p.y);
		return [Math.min(...ys), Math.max(...ys)];
	}
}
