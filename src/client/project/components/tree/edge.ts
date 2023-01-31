import { Polygon } from "@pixi/math";
import { computed } from "vue";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Control } from "client/base/control";
import { Layer } from "client/types/layers";
import { BLACK, LIGHT, DANGER } from "client/shared/constant";
import ProjectService from "client/services/projectService";
import { shallowRef } from "client/shared/decorators";
import { Label } from "client/screen/label";
import { Direction } from "client/types/enum";

import type { Sheet } from "../sheet";
import type { Vertex } from "./vertex";

const HIT_WIDTH = 5;
const WIDTH = 2;
const WIDTH_HOVER = 3;
const LABEL_DISTANCE = 0.5;

//=================================================================
/**
 * {@link Edge} 是樹狀邊的控制項。
 */
//=================================================================
export class Edge extends Control {

	public readonly type = "Edge";
	public readonly $priority: number = 0;

	@shallowRef public length: number;

	private readonly _v1: Vertex;
	private readonly _v2: Vertex;

	private readonly _line: SmoothGraphics = new SmoothGraphics();
	private readonly _label: Label;

	constructor(sheet: Sheet, v1: Vertex, v2: Vertex, length: number) {
		super(sheet);

		this._v1 = v1;
		this._v2 = v2;
		this.length = length;

		this.$setupHit(this._line);
		this.$addRootObject(this._line, sheet.$layers[Layer.$edge]);

		this._label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);
		this._label.$distance = LABEL_DISTANCE;

		this.$reactDraw(this._draw, this._hitArea, this._drawLabel);

		if(DEBUG_ENABLED) this._line.name = "Edge";
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 繪製方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _draw(): void {
		const color = app.settings.colorScheme.edge ?? app.isDark.value ? LIGHT : BLACK;
		const { x1, x2, y1, y2 } = this._coordinates.value;
		const sh = ProjectService.shrink.value;

		// 繪製線條
		this._line.clear()
			.lineStyle(
				(this.$hovered || this.$selected ? WIDTH_HOVER : WIDTH) * sh,
				this.$selected ? DANGER : color
			)
			.moveTo(x1, y1)
			.lineTo(x2, y2);
	}

	private _drawLabel(): void {
		const { x1, x2, y1, y2 } = this._coordinates.value;
		const dir = getDirectionOfSlope((y2 - y1) / (x2 - x1));
		this._label.$color = this.$selected ? DANGER : undefined;
		this._label.$draw(this.length.toString(), (x1 + x2) / 2, (y1 + y2) / 2, dir);
	}

	private _hitArea(): void {
		const { x1, x2, y1, y2 } = this._coordinates.value;

		// 更新點擊範圍
		let x = x2 - x1;
		let y = y2 - y1;
		const length = Math.sqrt(x * x + y * y);
		if(length == 0) {
			this._line.hitArea = null;
		} else {
			const s = ProjectService.scale.value;
			x *= HIT_WIDTH / length / s;
			y *= HIT_WIDTH / length / s;
			this._line.hitArea = new Polygon([
				{ x: x1 + y, y: y1 - x },
				{ x: x2 + y, y: y2 - x },
				{ x: x2 - y, y: y2 + x },
				{ x: x1 - y, y: y1 + x },
			]);
		}
	}

	private readonly _coordinates = computed(() => {
		const { x: x1, y: y1 } = this._v1.$location;
		const { x: x2, y: y2 } = this._v2.$location;
		return { x1, x2, y1, y2 };
	});
}

const T675 = Math.sqrt(2) + 1;
const T225 = Math.sqrt(2) - 1;

function getDirectionOfSlope(slope: number): Direction {
	if(slope == -Infinity) slope = Infinity;
	if(slope > T675) return Direction.R;
	else if(slope > T225) return Direction.LR;
	else if(slope > -T225) return Direction.B;
	else if(slope > -T675) return Direction.LL;
	else return Direction.L;
}
