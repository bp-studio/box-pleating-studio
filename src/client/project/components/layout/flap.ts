import { SmoothGraphics } from "@pixi/graphics-smooth";
import { Graphics } from "@pixi/graphics";

import { Layer } from "client/shared/layers";
import { drawContours, drawLines, fillContours } from "client/utils/contourUtil";
import ProjectService from "client/services/projectService";
import { Label } from "client/utils/label";
import { Independent } from "client/base/independent";
import { Direction, quadrantNumber } from "shared/types/direction";
import { style } from "client/services/styleService";
import { ScaledSmoothGraphics } from "client/utils/scaledSmoothGraphics";
import { shallowRef } from "client/shared/decorators";
import { SelectionController } from "client/controllers/selectionController";
import { constrainFlap, getDots } from "../grid/constrain";

import type { Grid } from "../grid/grid";
import type { LabelView } from "client/utils/label";
import type { GraphicsLike, SmoothGraphicsLike } from "client/utils/contourUtil";
import type { GraphicsData } from "core/service/updateModel";
import type { Layout } from "./layout";
import type { DragSelectable } from "client/base/draggable";
import type { Control } from "client/base/control";
import type { Edge } from "../tree/edge";
import type { JFlap, Memento, NodeId } from "shared/json";
import type { Vertex } from "../tree/vertex";

//=================================================================
/**
 * {@link Flap} is the control for the flap.
 */
//=================================================================
export class Flap extends Independent implements DragSelectable, LabelView, ISerializable<JFlap> {

	public static $isFlap(c: Control): c is Flap {
		return c.type === "Flap";
	}

	public readonly $tag: string;
	public readonly type = "Flap";
	public readonly $priority: number = 1;

	public readonly id: NodeId;

	public $graphics: GraphicsData;
	@shallowRef private accessor _width: number = 0;
	@shallowRef private accessor _height: number = 0;

	/**
	 * The parameters used for the drawing process.
	 * It could happen that the sources of truth are updated
	 * before the core processes the contours, so drawing
	 * by the sources could cause a noticeable glitch on
	 * slower devices.
	 */
	private _drawParams: Readonly<JFlap>;

	public readonly $vertex: Vertex;
	public readonly $edge: Edge;
	private readonly _layout: Layout;

	public readonly $label: Label;
	private readonly _dots: SmoothGraphics;
	private readonly _shade: Graphics;
	private readonly _ridge: SmoothGraphics;
	private readonly _circle: SmoothGraphics;
	private readonly _hinge: SmoothGraphics;

	/** Keep a record of the last updated location during fast dragging. */
	private _lastLocation: IPoint | undefined;

	public $anchor: IPoint = { x: 0, y: 0 };

	constructor(layout: Layout, json: JFlap, vertex: Vertex, edge: Edge, graphics: GraphicsData) {
		const sheet = layout.$sheet;
		super(sheet);
		this._layout = layout;

		this.$tag = "f" + json.id;
		this.id = json.id;
		this._location = { x: json.x, y: json.y };
		this._width = json.width;
		this._height = json.height;
		this.$graphics = graphics;
		this.$vertex = vertex;
		this.$edge = edge;
		this._drawParams = this.toJSON();

		this._dots = this.$addRootObject(new ScaledSmoothGraphics(), sheet.$layers[Layer.dot]);

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.shade]);
		this._ridge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.ridge]);
		this._circle = this.$addRootObject(new ScaledSmoothGraphics(), sheet.$layers[Layer.hinge]);
		this._hinge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.hinge]);
		this.$label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.label]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade, this._drawLabel);
	}

	public toJSON(): JFlap {
		return {
			id: this.id,
			x: this._location.x,
			y: this._location.y,
			width: this._width,
			height: this._height,
		};
	}

	public $toMemento(): Memento {
		return [this.$tag, this.toJSON()];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** The name of the flap, which is the same as that of the vertex. */
	public get name(): string {
		return this.$destructed ? "" : this.$vertex.name;
	}
	public set name(v: string) {
		this.$vertex.name = v;
	}

	/** The radius of the flap. */
	public get radius(): number {
		return this.$destructed ? 0 : this.$edge.length;
	}
	public set radius(v: number) {
		this.$edge.length = v;
	}

	/** The height of the flap. */
	public get height(): number {
		return this._height;
	}
	public set height(v: number) {
		if(v < 0 || !this._testResize(this._width, v)) return;
		const oldValue = this._height;
		this._height = v;
		this.$project.design.$batchUpdateManager.$addFlap(this,
			() => this.$project.history.$fieldChange(this, "height", oldValue, v, false)
		);
	}

	/** The width of the flap. */
	public get width(): number {
		return this._width;
	}
	public set width(v: number) {
		if(v < 0 || !this._testResize(v, this._height)) return;
		const oldValue = this._width;
		this._width = v;
		this.$project.design.$batchUpdateManager.$addFlap(this,
			() => this.$project.history.$fieldChange(this, "width", oldValue, v, false)
		);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get isDeletable(): boolean {
		return !this.$destructed && this.$vertex.isDeletable;
	}

	public delete(): Promise<void> {
		const promise = this.$vertex.delete();
		SelectionController.$toggle(this, false); // order matters here
		return promise;
	}

	public goToDual(): void {
		this._layout.$goToDual([this]);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Control methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public override $selectableWith(c: Control): boolean {
		return c instanceof Flap;
	}

	public override $constrainBy(v: IPoint): IPoint {
		return constrainFlap(p => this._sheet.grid.$constrain(p), this._location, this._width, this.height, v);
	}

	public $testGrid(grid: Grid): boolean {
		return this._testResize(this._width, this._height, grid);
	}

	public override $anchors(): IPoint[] {
		return getDots(this._location, this._width, this._height);
	}

	public $sync(p: IPoint): Promise<void> {
		return this._move(p.x, p.y);
	}

	/** Manipulate by internal functions instead of by UI. */
	public $manipulate(x: number, y: number, width: number, height: number): void {
		const location = { x, y };
		const w = this._width;
		const h = this._height;
		this._lastLocation = this._location;
		this._location = location;
		this._width = width;
		this._height = height;
		this.$project.design.$batchUpdateManager.$addFlap(this, () => {
			if(w != width) this.$project.history.$fieldChange(this, "width", w, width, false);
			if(h != height) this.$project.history.$fieldChange(this, "height", h, height, false);
			this.$project.history.$move(this, location, this._lastLocation);
		});
	}

	protected override _move(x: number, y: number): Promise<void> {
		const location = { x, y };
		this._lastLocation ||= this._location;
		this._location = location;
		return this.$project.design.$batchUpdateManager.$addFlap(this, () => {
			this.$project.history.$move(this, location, this._lastLocation);
			this._lastLocation = undefined;
		});
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Update {@link _drawParams} and return it.
	 *
	 * The moment of calling this method is critical;
	 * it needs to be exactly at the moment data is sent to the Core.
	 */
	public $updateDrawParams(): JFlap {
		return this._drawParams = this.toJSON();
	}

	public $redraw(data: GraphicsData): void {
		this.$graphics = data;
		this._drawLabel();
		this._draw();
	}

	public $drawCircle(graphics: GraphicsLike): void {
		const { x, y, width: w, height: h } = this._drawParams;
		const r = this.$edge.length;
		graphics.drawRoundedRect(x - r, y - r, w + r + r, h + r + r, r);
	}

	public $drawDot(graphics: SmoothGraphicsLike): void {
		const s = ProjectService.scale.value;
		const size = style.dot.size * ProjectService.shrink.value ** style.dot.exp;
		const { width: w, height: h } = this._drawParams;
		const pts = getDots(this._drawParams, w, h);
		graphics.clear().lineStyle(style.dot.width, style.dot.color);
		for(let i = 0; i < quadrantNumber; i++) {
			if(this._sheet.grid.$contains(pts[i])) {
				graphics
					.beginFill(style.dot.fill)
					.drawCircle(pts[i].x, pts[i].y, size / s)
					.endFill();
			}
		}
	}

	private _drawShade(): void {
		if(this.$selected) this._shade.alpha = style.shade.alpha;
		else if(this.$hovered) this._shade.alpha = style.shade.hover;
		else this._shade.alpha = 0;
	}

	private _drawLabel(): void {
		const { x, y, width: w, height: h } = this._drawParams;
		const dir = w || h ? Direction.none : undefined;
		this.$anchor = { x: x + w / 2, y: y + h / 2 };
		this.$label.$draw(this.$vertex.name, this.$anchor.x, this.$anchor.y, dir);
	}

	private _draw(): void {
		const sh = ProjectService.shrink.value;
		const hingeColor = style.hinge.color;
		this._shade.clear();
		fillContours(this._shade, this.$graphics.contours, hingeColor);

		this.$drawDot(this._dots);

		this._hinge.clear().lineStyle(style.hinge.width * sh, hingeColor);
		drawContours(this._hinge, this.$graphics.contours);

		this._ridge.clear().lineStyle(style.ridge.width * sh, style.ridge.color);
		drawLines(this._ridge, this.$graphics.ridges);

		this._circle.clear().lineStyle(sh, hingeColor);
		this.$drawCircle(this._circle);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Test if the new size is acceptable. */
	private _testResize(w: number, h: number, grid: Grid = this._sheet.grid): boolean {
		if(this.$project.history.$isLocked) return true;
		return getDots(this._location, w, h)
			.filter(p => !grid.$contains(p))
			.length <= 1; // At most one tip may go beyond the range of the sheet.
	}
}
