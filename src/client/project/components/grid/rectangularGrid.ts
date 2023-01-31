import { shallowRef } from "client/shared/decorators";
import { GridType } from "shared/json/enum";
import { Direction } from "client/types/enum";

import type { GraphicsLike } from "client/screen/contourUtil";
import type { JSheet } from "shared/json";
import type { IGrid } from "./iGrid";

const DEFAULT_SIZE = 16;
const MIN_SIZE = 4;

//=================================================================
/**
 * {@link RectangularGrid} 是長方形的格線。
 */
//=================================================================

export class RectangularGrid implements IGrid {

	public readonly type = GridType.rectangular;

	@shallowRef((v: number) => v >= MIN_SIZE) public height: number;
	@shallowRef((v: number) => v >= MIN_SIZE) public width: number;

	constructor(width?: number, height?: number) {
		this.height = height ?? DEFAULT_SIZE;
		this.width = width ?? DEFAULT_SIZE;
	}

	public toJSON(): JSheet {
		return {
			type: GridType.rectangular,
			height: this.height,
			width: this.width,
		};
	}

	public $constrain(p: IPoint): IPoint {
		let { x, y } = p;
		const w = this.width, h = this.height;
		if(x < 0) x = 0;
		if(x > w) x = w;
		if(y < 0) y = 0;
		if(y > h) y = h;
		return { x, y };
	}

	public $contains(p: IPoint): boolean {
		const { x, y } = p;
		const w = this.width, h = this.height;
		return 0 <= x && x <= w && 0 <= y && y <= h;
	}

	public $getLabelDirection(x: number, y: number): Direction {
		const w = this.width, h = this.height;
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
		border.drawRect(0, 0, this.width, this.height);
	}

	public $drawGrid(grid: GraphicsLike): void {
		for(let i = 1; i < this.height; i++) {
			grid.moveTo(0, i);
			grid.lineTo(this.width, i);
		}
		for(let i = 1; i < this.width; i++) {
			grid.moveTo(i, 0);
			grid.lineTo(i, this.height);
		}
	}

	public readonly $offset: IPoint = { x: 0, y: 0 };

	public get $height(): number {
		return this.height;
	}

	public get $width(): number {
		return this.width;
	}
}
