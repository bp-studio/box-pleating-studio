import { shallowRef } from "client/shared/decorators";
import { GridType } from "shared/json/enum";
import { Direction } from "client/types/enum";

import type { GraphicsLike } from "client/screen/contourUtil";
import type { JSheet } from "shared/json/components";
import type { IGrid } from "./iGrid";
import type { Sheet } from "../sheet";

const DEFAULT_SIZE = 16;
const MIN_SIZE = 6;

//=================================================================
/**
 * {@link DiagonalGrid} 是對角正方形的格線。
 */
//=================================================================

export class DiagonalGrid implements IGrid {

	public readonly type = GridType.diagonal;

	private readonly _sheet: Sheet;

	private _testSize: number;
	@shallowRef private _size: number;

	constructor(sheet: Sheet, width?: number, height?: number) {
		this._sheet = sheet;
		width ??= DEFAULT_SIZE;
		height ??= DEFAULT_SIZE;
		this._testSize = this._size = Math.round((width + height) / 2);
	}

	public toJSON(): JSheet {
		return {
			type: GridType.diagonal,
			height: this._size,
			width: this._size,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 代理屬性
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get size(): number {
		return this._size;
	}
	public set size(v: number) {
		if(v < MIN_SIZE) return;
		this._testSize = v;
		for(const c of this._sheet.$independents) {
			if(!c.$testGrid(this)) {
				this._testSize = this._size;
				return;
			}
		}
		this._size = v;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $constrain(p: IPoint): IPoint {
		let { x, y } = p;
		const s = this._size, h = s % 2;
		const f = (s - h) / 2;
		const c = (s + h) / 2;

		if(x + y < f) {
			const d = f - x - y;
			x += Math.floor(d / 2);
			y += Math.ceil(d / 2);
		}

		if(y - x > c) {
			const d = y - x - c;
			x += Math.floor(d / 2);
			y -= Math.ceil(d / 2);
		}

		if(x - y > c) {
			const d = x - y - c;
			x -= Math.floor(d / 2);
			y += Math.ceil(d / 2);
		}

		if(x + y > c + s) {
			const d = x + y - c - s;
			x -= Math.floor(d / 2);
			y -= Math.ceil(d / 2);
		}

		if(x < 0) x = 0;
		if(x > s) x = s;

		return { x, y };
	}

	public $contains(p: IPoint): boolean {
		const { x, y } = p;
		const s = this._testSize, h = s % 2;
		const f = (s - h) / 2;
		const c = (s + h) / 2;
		return x + y >= f && y - x <= c && x - y <= c && x + y <= c + s;
	}

	public $getLabelDirection(x: number, y: number): Direction {
		const shift = this._size % 2, s = this._size + shift, h = s / 2;
		if(shift == 0) {
			if(x == 0 && y == h) return Direction.L;
			if(x == h && y == 0) return Direction.B;
			if(x == h && y == s) return Direction.T;
			if(x == s && y == h) return Direction.R;
		}
		if(x + y == h - shift) return Direction.LL;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		if(x + y == h * 3 - shift) return Direction.UR;
		if(x - y == h) return Direction.LR;
		if(y - x == h) return Direction.UL;
		return Direction.B;
	}

	public $drawBorder(border: GraphicsLike): void {
		let full = this.$renderHeight, half = full / 2;
		const shift = this._size % 2 / 2;
		full -= shift;
		half -= shift;
		border.moveTo(half, -shift);
		border.lineTo(full, half);
		border.lineTo(half, full);
		border.lineTo(-shift, half);
		border.closePath();
	}

	public $drawGrid(grid: GraphicsLike): void {
		const size = this._size;
		const shift = this._size % 2;
		for(let i = 1 - shift; i < size + shift; i++) {
			const offset = Math.abs(i - size / 2) - shift / 2;
			grid.moveTo(offset, i);
			grid.lineTo(size - offset, i);
			grid.moveTo(i, offset);
			grid.lineTo(i, size - offset);
		}
	}

	public get $offset(): IPoint {
		const shift = this._size % 2 / 2;
		return { x: -shift, y: -shift };
	}

	public get $renderHeight(): number {
		return this._size + this._size % 2;
	}

	public get $renderWidth(): number {
		return this._size + this._size % 2;
	}
}
