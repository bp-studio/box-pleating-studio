import { Circle } from "@pixi/math";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import ProjectService from "client/services/projectService";
import { BLACK, DANGER, LIGHT } from "client/shared/constant";
import { Label } from "client/screen/label";
import { Independent } from "client/base/independent";

import type { DragSelectable } from "client/base/draggable";
import type { Control } from "client/base/control";
import type { JVertex } from "shared/json";
import type { Sheet } from "../sheet";

const SIZE = 4;
const BORDER_WIDTH = 1;
const BORDER_WIDTH_HOVER = 3;
const FILL_COLOR = 0x6699FF;

//=================================================================
/**
 * {@link Vertex} 是樹狀節點的控制項。
 */
//=================================================================
export class Vertex extends Independent implements DragSelectable {

	public readonly type = "Vertex";
	public readonly $priority: number = Infinity;

	public readonly id: number;
	public readonly height = 0;
	public readonly width = 0;

	@shallowRef public name: string;

	private readonly _dot: SmoothGraphics;
	private readonly _label: Label;

	constructor(json: JVertex, sheet: Sheet) {
		super(sheet);

		this.id = json.id;
		this.$location.x = json.x;
		this.$location.y = json.y;
		this.name = json.name;

		this._dot = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$vertex]);
		this.$setupHit(this._dot, new Circle(0, 0, SIZE * 2));

		this._label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);

		this.$reactDraw(this._draw, this._drawLabel);

		if(DEBUG_ENABLED) this._dot.name = "Vertex";
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 控制項方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $anchor(): IPoint {
		return this.$location;
	}

	public override $constrainBy(v: IPoint): IPoint {
		const l = this.$location;
		const target = { x: l.x + v.x, y: l.y + v.y };
		const fix = this._sheet.grid.$constrain(target);
		return { x: fix.x - l.x, y: fix.y - l.y };
	}

	public override $selectableWith(c: Control): boolean {
		return c instanceof Vertex;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 繪製方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _draw(): void {
		const s = ProjectService.scale.value;
		this._dot.x = this.$location.x;
		this._dot.y = this.$location.y;
		this._dot.scale.set(1 / s); // 把座標放大 s 倍以增進圓弧繪製品質

		const color = app.isDark.value ? LIGHT : BLACK;
		const width = this.$selected || this.$hovered ? BORDER_WIDTH_HOVER : BORDER_WIDTH;
		const size = SIZE * Math.sqrt(ProjectService.shrink.value);
		this._dot.clear()
			.lineStyle(width, this.$selected ? DANGER : color)
			.beginFill(FILL_COLOR)
			.drawCircle(0, 0, size)
			.endFill();
	}

	private _drawLabel(): void {
		this._label.$color = this.$selected ? DANGER : undefined;
		this._label.$draw(this.name, this.$location.x, this.$location.y);
	}
}
