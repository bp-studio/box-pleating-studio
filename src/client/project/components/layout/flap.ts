import { SmoothGraphics } from "@pixi/graphics-smooth";
import { Graphics } from "@pixi/graphics";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import { Draggable } from "client/base/draggable";
import { drawContours, fillContours } from "client/screen/contourUtil";
import { Direction } from "client/types/enum";
import { BLACK, DANGER, LIGHT } from "client/shared/constant";
import ProjectService from "client/services/projectService";
import { HINGE_COLOR, HINGE_WIDTH, RIDGE_WIDTH, SHADE_ALPHA, SHADE_HOVER } from "./river";
import { Label } from "client/screen/label";

import type { Control } from "client/base/control";
import type { Edge } from "../tree/edge";
import type { Contour } from "shared/types/geometry";
import type { JFlap } from "shared/json";
import type { Sheet } from "../sheet";
import type { Vertex } from "../tree/vertex";

const SIZE = 3;
const DOT_FACTOR = 0.75;
const DOT_FILL = 0x6699FF;

//=================================================================
/**
 * {@link Flap} 是角片矩形的控制項。
 */
//=================================================================
export class Flap extends Draggable {

	public readonly type = "Flap";
	public readonly $priority: number = 1;

	public readonly id: number;

	@shallowRef public width: number = 0;
	@shallowRef public height: number = 0;
	@shallowRef private _contours: Contour[];

	private readonly _vertex: Vertex;
	private readonly _edge: Edge;

	private readonly _dots: SmoothGraphics[];
	private readonly _shade: Graphics;
	private readonly _ridge: SmoothGraphics;
	private readonly _circle: SmoothGraphics;
	private readonly _hinge: SmoothGraphics;
	public readonly $label: Label;


	constructor(json: JFlap, vertex: Vertex, edge: Edge, sheet: Sheet) {
		super();

		this.id = json.id;
		this.$location.x = json.x;
		this.$location.y = json.y;
		this.width = json.width;
		this.height = json.height;
		this._contours = json.contour!;
		this._vertex = vertex;
		this._edge = edge;

		this._dots = Array.from({ length: 4 }, () =>
			this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$dot])
		);

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.$shade]);
		this._ridge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$ridge]);
		this._circle = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$hinge]);
		this._hinge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$hinge]);
		this.$label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade, this._drawDot);

		if(DEBUG_ENABLED) this._hinge.name = "Flap Hinge";
	}

	public override $selectableWith(c: Control): boolean {
		return c instanceof Flap;
	}

	private _drawShade(): void {
		if(this.$selected) this._shade.alpha = SHADE_ALPHA;
		else if(this.$hovered) this._shade.alpha = SHADE_HOVER;
		else this._shade.alpha = 0;
	}

	private _drawDot(): void {
		const s = ProjectService.scale.value;
		const size = SIZE * ProjectService.shrink.value ** DOT_FACTOR;
		this._dots.forEach(d => {
			// 把座標放大 s 倍以增進圓弧繪製品質
			d.scale.set(1 / s);
			d.clear()
				.lineStyle(1, app.isDark.value ? LIGHT : BLACK)
				.beginFill(DOT_FILL)
				.drawCircle(0, 0, size)
				.endFill();
		});
	}

	private _draw(): void {
		const sh = ProjectService.shrink.value;
		const w = this.width, h = this.height;
		const { x, y } = this.$location;
		const hingeColor = app.settings.colorScheme.hinge ?? HINGE_COLOR;
		this._shade.clear();
		fillContours(this._shade, this._contours, HINGE_COLOR);

		this._dots[Direction.LL].position.set(x, y);
		this._dots[Direction.UR].visible = w > 0 && h > 0;
		this._dots[Direction.UR].position.set(x + w, y + h);
		this._dots[Direction.UL].visible = h > 0;
		this._dots[Direction.UL].position.set(x, y + h);
		this._dots[Direction.LR].visible = w > 0;
		this._dots[Direction.LR].position.set(x + w, y);

		this._hinge.clear().lineStyle(HINGE_WIDTH * sh, hingeColor);
		drawContours(this._hinge, this._contours);

		const ridgeColor = app.settings.colorScheme.ridge ?? DANGER;
		this._ridge.clear().lineStyle(RIDGE_WIDTH * sh, ridgeColor);
		if(w || h) {
			this._ridge.moveTo(x, y)
				.lineTo(x + w, y)
				.lineTo(x + w, y + h)
				.lineTo(x, y + h)
				.closePath();
		}

		// 把座標放大 s 倍以增進圓弧繪製品質
		const s = ProjectService.scale.value;
		const r = this._edge.length * s;
		this._circle.scale.set(1 / s);
		this._circle.clear()
			.lineStyle(sh, hingeColor)
			.drawRoundedRect(x * s - r, y * s - r, w * s + r + r, h * s + r + r, r);
	}
}
