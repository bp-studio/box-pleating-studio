import { shallowRef } from "client/shared/decorators";
import { GridType } from "shared/json/enum";
import { Direction } from "shared/types/direction";

import type { Path } from "shared/types/geometry";
import type { GraphicsLike } from "client/utils/contourUtil";
import type { JSheet } from "shared/json";
import type { IGrid } from "./iGrid";
import type { Sheet } from "../sheet";

const DEFAULT_SIZE = 16;
const MIN_SIZE = 4; // Used to be 8, now 4.

//=================================================================
/**
 * {@link RectangularGrid} is the most basic grid.
 */
//=================================================================

export class RectangularGrid implements IGrid {

	public readonly type = GridType.rectangular;

	private readonly _sheet: Sheet;
	private _testWidth: number;
	private _testHeight: number;

	@shallowRef private _width: number;
	@shallowRef private _height: number;

	constructor(sheet: Sheet, width?: number, height?: number) {
		this._sheet = sheet;
		this._testHeight = this._height = height ?? DEFAULT_SIZE;
		this._testWidth = this._width = width ?? DEFAULT_SIZE;
	}

	public toJSON(): JSheet {
		return {
			type: this.type,
			height: this._height,
			width: this._width,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get diameter(): number {
		return Math.max(this._height, this._width);
	}

	public get height(): number {
		return this._height;
	}
	public set height(v: number) {
		if(v < MIN_SIZE) return;
		this._testHeight = v;
		for(const c of this._sheet.$independents) {
			if(!c.$testGrid(this)) {
				this._testHeight = this._height;
				return;
			}
		}
		this._height = v;
	}

	public get width(): number {
		return this._width;
	}
	public set width(v: number) {
		if(v < MIN_SIZE) return;
		this._testWidth = v;
		for(const c of this._sheet.$independents) {
			if(!c.$testGrid(this)) {
				this._testWidth = this._width;
				return;
			}
		}
		this._width = v;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $constrain(p: IPoint): IPoint {
		let { x, y } = p;
		const w = this._width, h = this._height;
		if(x < 0) x = 0;
		if(x > w) x = w;
		if(y < 0) y = 0;
		if(y > h) y = h;
		return { x, y };
	}

	public $contains(p: IPoint): boolean {
		const { x, y } = p;
		const w = this._testWidth, h = this._testHeight;
		return 0 <= x && x <= w && 0 <= y && y <= h;
	}

	public $getLabelDirection(x: number, y: number): Direction {
		const w = this._width, h = this._height;
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
		border.drawRect(0, 0, this._width, this._height);
	}

	public $getBorderPath(): Path {
		const w = this._width, h = this._height;
		return [
			{ x: 0, y: 0 },
			{ x: w, y: 0 },
			{ x: w, y: h },
			{ x: 0, y: h },
		];
	}

	public $drawGrid(grid: GraphicsLike): void {
		for(let i = 1; i < this._height; i++) {
			grid.moveTo(0, i);
			grid.lineTo(this._width, i);
		}
		for(let i = 1; i < this._width; i++) {
			grid.moveTo(i, 0);
			grid.lineTo(i, this._height);
		}
	}

	public $getTransformMatrix(size: number, reorient: boolean): number[] {
		const w = this._width, h = this._height;
		const max = Math.max(w, h);
		const s = size / max;
		return [s, 0, 0, -s, -s * w / 2, s * h / 2];
	}

	public readonly $offset: IPoint = { x: 0, y: 0 };

	public get $renderHeight(): number {
		return this._height;
	}

	public get $renderWidth(): number {
		return this._width;
	}
}
