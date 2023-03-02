import { Circle } from "@pixi/math";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import ProjectService from "client/services/projectService";
import { BLACK, DANGER, LIGHT } from "client/shared/constant";
import { Label } from "client/screen/label";
import { Independent } from "client/base/independent";

import type { IGrid } from "../grid";
import type { Tree } from "./tree";
import type { DragSelectable } from "client/base/draggable";
import type { Control } from "client/base/control";
import type { JVertex } from "shared/json";

const SIZE = 4;
const BORDER_WIDTH = 1;
const BORDER_WIDTH_HOVER = 3;
const FILL_COLOR = 0x6699FF;

//=================================================================
/**
 * {@link Vertex} is the control for the tree vertices.
 */
//=================================================================
export class Vertex extends Independent implements DragSelectable, ISerializable<JVertex> {

	public readonly type = "Vertex";
	public readonly $priority: number = Infinity;

	public readonly id: number;
	public readonly height = 0;
	public readonly width = 0;

	@shallowRef public override $location: IPoint;
	@shallowRef public $degree: number = 0;

	private readonly _tree: Tree;
	private readonly _dot: SmoothGraphics;
	private readonly _label: Label;
	public $isNew: boolean;

	constructor(tree: Tree, json: JVertex) {
		const sheet = tree.$sheet;
		super(sheet);
		this._tree = tree;

		this.id = json.id;
		this.$isNew = json.isNew ?? true;
		this.$location = { x: json.x, y: json.y };
		this.name = json.name;

		this._dot = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$vertex]);
		this.$setupHit(this._dot, new Circle(0, 0, SIZE * 2));

		this._label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);

		this.$reactDraw(this._draw, this._drawLabel);

		if(DEBUG_ENABLED) this._dot.name = "Vertex";
	}

	public toJSON(): JVertex {
		return {
			id: this.id,
			name: this.name,
			x: this.$location.x,
			y: this.$location.y,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@shallowRef public name: string;

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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _move(x: number, y: number): void {
		super._move(x, y);
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
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _draw(): void {
		const s = ProjectService.scale.value;
		this._dot.x = this.$location.x;
		this._dot.y = this.$location.y;
		this._dot.scale.set(1 / s); // Scale the coordinates by s times to improve the quality of arcs

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
