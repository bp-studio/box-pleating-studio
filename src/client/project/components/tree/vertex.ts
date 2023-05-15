import { Circle } from "@pixi/core";

import { Layer } from "client/shared/layers";
import { field, shallowRef } from "client/shared/decorators";
import ProjectService from "client/services/projectService";
import { Label } from "client/utils/label";
import { Independent } from "client/base/independent";
import { style } from "client/services/styleService";
import { ScaledSmoothGraphics } from "client/utils/scaledSmoothGraphics";

import type { SmoothGraphicsLike } from "client/utils/contourUtil";
import type { SmoothGraphics } from "@pixi/graphics-smooth";
import type { LabelView } from "client/utils/label";
import type { IGrid } from "../grid";
import type { Tree } from "./tree";
import type { DragSelectable } from "client/base/draggable";
import type { Control } from "client/base/control";
import type { JVertex, Memento } from "shared/json";

//=================================================================
/**
 * {@link Vertex} is the control for the tree vertices.
 */
//=================================================================
export class Vertex extends Independent implements DragSelectable, LabelView, ISerializable<JVertex> {

	public readonly $tag: string;
	public readonly type = "Vertex";
	public readonly $priority: number = Infinity;

	public readonly id: number;
	public readonly height = 0;
	public readonly width = 0;

	/**
	 * The movement of {@link Vertex Vertices} does not concerns the Core,
	 * so we directly made it a {@link shallowRef}.
	 */
	@shallowRef public override $location: IPoint;

	/**
	 * Several UI depends on this value, so it is reactive.
	 */
	@shallowRef public $degree: number = 0;

	private readonly _tree: Tree;
	private readonly _dot: SmoothGraphics;
	public readonly $label: Label;
	public $isNew: boolean;

	constructor(tree: Tree, json: JVertex) {
		const sheet = tree.$sheet;
		super(sheet);
		this._tree = tree;

		this.$tag = "v" + json.id;
		this.id = json.id;
		this.$isNew = json.isNew ?? true;
		this.$location = { x: json.x, y: json.y };
		this.name = json.name;

		this._dot = this.$addRootObject(new ScaledSmoothGraphics(), sheet.$layers[Layer.$vertex]);
		this.$setupHit(this._dot, new Circle(0, 0, style.vertex.size * 2));

		this.$label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);

		this.$reactDraw(this._draw, this._drawLabel);
	}

	public toJSON(): JVertex {
		return {
			id: this.id,
			name: this.name,
			x: this.$location.x,
			y: this.$location.y,
		};
	}

	public $toMemento(): Memento {
		return [this.$tag, this.toJSON()];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@field public name: string;

	public addLeaf(length: number): Promise<void> {
		return this._tree.$addLeaf(this, length);
	}

	public get isLeaf(): boolean {
		return this.$degree === 1;
	}

	public get isDeletable(): boolean {
		return !this._tree.isMinimal && this.$degree <= 2;
	}

	public delete(): void {
		if(this.$degree === 1) this._tree.$delete([this]);
		if(this.$degree === 2) this._tree.$join(this);
	}

	public goToDual(): void {
		this._tree.$goToDual([this]);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Control methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $anchor(): IPoint {
		return this.$location;
	}

	public override $constrainBy(v: IPoint): IPoint {
		return this._fixVector(this.$location, v);
	}

	public override $selectableWith(c: Control): boolean {
		return c instanceof Vertex;
	}

	public $testGrid(grid: IGrid): boolean {
		return grid.$contains(this.$location);
	}

	protected override async _move(x: number, y: number): Promise<void> {
		await super._move(x, y);
		if(this.$isNew) {
			const layout = this._tree.$project.design.layout;
			const flap = layout.$syncFlaps.get(this.id);
			if(!flap) {
				this.$isNew = false;
			} else {
				const grid = layout.$sheet.grid;
				const xFactor = grid.$renderWidth / this._sheet.grid.$renderWidth;
				const yFactor = grid.$renderHeight / this._sheet.grid.$renderHeight;
				const p: IPoint = {
					x: Math.round(this.$location.x * xFactor),
					y: Math.round(this.$location.y * yFactor),
				};
				flap.$sync(grid.$constrain(p));
			}
		} else if(!pendingFlush) {
			return pendingFlush = Promise.resolve().then(() => {
				pendingFlush = undefined;
				this.$project.history.$flush();
			});
		}
		return Promise.resolve();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $drawDot(graphics: SmoothGraphicsLike): void {
		const s = ProjectService.scale.value;
		const width = this.$selected || this.$hovered ? style.vertex.hover : style.vertex.width;
		const size = style.vertex.size * Math.sqrt(ProjectService.shrink.value);
		graphics.clear()
			.lineStyle(width, this.$selected ? style.vertex.selected : style.vertex.color)
			.beginFill(style.vertex.fill)
			.drawCircle(this.$location.x, this.$location.y, size / s)
			.endFill();
	}

	private _draw(): void {
		this.$drawDot(this._dot);
		const s = ProjectService.scale.value;
		this._dot.hitArea = new Circle(this.$location.x * s, this.$location.y * s, style.vertex.size * 2);
	}

	private _drawLabel(): void {
		this.$label.$color = this.$selected ? style.vertex.selected : undefined;
		this.$label.$draw(this.name, this.$location.x, this.$location.y);
	}
}

/**
 * If only established vertices are moving, the Core is not invoked,
 * and the history can be flushed right away. We use this {@link Promise}
 * to control the flushing.
 */
let pendingFlush: Promise<void> | undefined;
