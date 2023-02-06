import { SmoothGraphics } from "@pixi/graphics-smooth";
import { Graphics } from "@pixi/graphics";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import { drawContours, fillContours } from "client/screen/contourUtil";
import { Direction } from "client/types/enum";
import { BLACK, DANGER, LIGHT } from "client/shared/constant";
import ProjectService from "client/services/projectService";
import { HINGE_COLOR, HINGE_WIDTH, RIDGE_WIDTH, SHADE_ALPHA, SHADE_HOVER } from "./river";
import { Label } from "client/screen/label";
import { Independent } from "client/base/independent";

import type { IGrid } from "../grid";
import type { Layout } from "./layout";
import type { DragSelectable } from "client/base/draggable";
import type { Control } from "client/base/control";
import type { Edge } from "../tree/edge";
import type { Contour } from "shared/types/geometry";
import type { JFlap } from "shared/json";
import type { Vertex } from "../tree/vertex";

const SIZE = 3;
const DOT_FACTOR = 0.75;
const DOT_FILL = 0x6699FF;

//=================================================================
/**
 * {@link Flap} 是角片矩形的控制項。
 */
//=================================================================
export class Flap extends Independent implements DragSelectable, ISerializable<JFlap> {

	public readonly type = "Flap";
	public readonly $priority: number = 1;

	public readonly id: number;

	@shallowRef public $contours: Contour[];
	@shallowRef private _width: number = 0;
	@shallowRef private _height: number = 0;

	public readonly $vertex: Vertex;
	public readonly $edge: Edge;
	private readonly _layout: Layout;

	private readonly _dots: SmoothGraphics[];
	private readonly _shade: Graphics;
	private readonly _ridge: SmoothGraphics;
	private readonly _circle: SmoothGraphics;
	private readonly _hinge: SmoothGraphics;
	private readonly _label: Label;

	public $anchor: Readonly<IPoint> = { x: 0, y: 0 };

	constructor(layout: Layout, json: JFlap, vertex: Vertex, edge: Edge, contours: Contour[]) {
		const sheet = layout.$sheet;
		super(sheet);
		this._layout = layout;

		this.id = json.id;
		this.$location.x = json.x;
		this.$location.y = json.y;
		this._width = json.width;
		this._height = json.height;
		this.$contours = contours;
		this.$vertex = vertex;
		this.$edge = edge;

		this._dots = Array.from({ length: 4 }, () =>
			this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$dot])
		);

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.$shade]);
		this._ridge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$ridge]);
		this._circle = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$hinge]);
		this._hinge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$hinge]);
		this._label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade, this._drawDot, this._drawLabel);

		if(DEBUG_ENABLED) this._hinge.name = "Flap Hinge";
	}

	public toJSON(): JFlap {
		return {
			id: this.id,
			x: this.$location.x,
			y: this.$location.y,
			width: this.width,
			height: this.height,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 代理屬性
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 角片名稱，等同於節點名稱 */
	public get name(): string {
		return this.$vertex.name;
	}
	public set name(v: string) {
		this.$vertex.name = v;
	}

	/** 角片圓角半徑 */
	public get radius(): number {
		return this.$edge.length;
	}
	public set radius(v: number) {
		this.$edge.length = v;
	}

	/** 角片高度 */
	public get height(): number {
		return this._height;
	}
	public set height(v: number) {
		if(v < 0 || !this._testResize(this.width, v)) return;
		this._height = v;
		this._layout.$updateFlap(this);
	}

	/** 角片寬度 */
	public get width(): number {
		return this._width;
	}
	public set width(v: number) {
		if(v < 0 || !this._testResize(v, this.height)) return;
		this._width = v;
		this._layout.$updateFlap(this);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get isDeletable(): boolean {
		return this.$vertex.isDeletable;
	}

	public delete(): void {
		this.$vertex.delete();
	}

	public goToDual(): void {
		this._layout.$goToDual([this]);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 控制項方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $selectableWith(c: Control): boolean {
		return c instanceof Flap;
	}

	public override $constrainBy(v: IPoint): IPoint {
		const w = this.width, h = this.height;
		const zeroWidth = w === 0;
		const zeroHeight = h === 0;
		const { x, y } = this.$location;
		if(zeroWidth && zeroHeight) {
			return this._fixVector(this.$location, v);
		} else if(zeroWidth || zeroHeight) {
			v = this._fixVector(this.$location, v);
			const p = zeroWidth ? { x, y: y + h } : { x: x + w, y };
			return this._fixVector(p, v);
		} else {
			// 允許其中至多一個尖點超出紙張範圍
			const data = this._getDots(w, h)
				.map(p => {
					const fix = this._fixVector(p, v);
					const dx = fix.x - v.x;
					const dy = fix.y - v.y;
					const d = dx * dx + dy * dy;
					return { p, d, fix };
				})
				.filter(e => e.d > 0)
				.sort((a, b) => b.d - a.d);
			if(data.length <= 1) return v;
			let result = data[1].fix;
			result = this._fixVector(data[2].p, result);
			return this._fixVector(data[3].p, result);
		}
	}

	public $testGrid(grid: IGrid): boolean {
		return this._testResize(this._width, this._height, grid);
	}

	public $sync(p: IPoint): void {
		this._move(p.x, p.y);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _move(x: number, y: number): void {
		super._move(x, y);
		this._layout.$updateFlap(this);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 繪製方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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

	private _drawLabel(): void {
		const w = this.width, h = this.height;
		const { x, y } = this.$location;
		const dir = w || h ? Direction.none : undefined;
		this.$anchor = { x: x + w / 2, y: y + h / 2 };
		this._label.$draw(this.$vertex.name, this.$anchor.x, this.$anchor.y, dir);
	}

	private _draw(): void {
		const sh = ProjectService.shrink.value;
		const w = this.width, h = this.height;
		const { x, y } = this.$location;
		const hingeColor = app.settings.colorScheme.hinge ?? HINGE_COLOR;
		this._shade.clear();
		fillContours(this._shade, this.$contours, HINGE_COLOR);

		const pts = this._getDots(w, h);
		for(let i = 0; i <= Direction.LR; i++) {
			this._dots[i].visible = this._sheet.grid.$contains(pts[i]);
			this._dots[i].position.set(pts[i].x, pts[i].y);
		}

		this._hinge.clear().lineStyle(HINGE_WIDTH * sh, hingeColor);
		drawContours(this._hinge, this.$contours);

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
		const r = this.$edge.length * s;
		this._circle.scale.set(1 / s);
		this._circle.clear()
			.lineStyle(sh, hingeColor)
			.drawRoundedRect(x * s - r, y * s - r, w * s + r + r, h * s + r + r, r);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 依照象限順序排列的尖點位置 */
	private _getDots(w: number, h: number): IPoint[] {
		const { x, y } = this.$location;
		return [
			{ x: x + w, y: y + h },
			{ x, y: y + h },
			this.$location,
			{ x: x + w, y },
		];
	}

	/** 測試看看變更後的大小是否可以接受 */
	private _testResize(w: number, h: number, grid: IGrid = this._sheet.grid): boolean {
		return this._getDots(w, h)
			.filter(p => !grid.$contains(p))
			.length <= 1; // 至多只能有一個尖點超出紙張範圍
	}
}
