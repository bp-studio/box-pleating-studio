import { Circle } from "@pixi/math";

import { Layer } from "client/shared/layers";
import { field, shallowRef } from "client/shared/decorators";
import ProjectService from "client/services/projectService";
import { Label } from "client/utils/label";
import { Independent } from "client/base/independent";
import { style } from "client/services/styleService";
import { ScaledSmoothGraphics } from "client/utils/scaledSmoothGraphics";
import { getRelativePoint } from "../sheet";
import { MAX_TREE_HEIGHT } from "shared/types/constants";
import { constrainVertex } from "../grid/constrain";

import type { Grid } from "../grid/grid";
import type { SmoothGraphicsLike } from "client/utils/contourUtil";
import type { SmoothGraphics } from "@pixi/graphics-smooth";
import type { LabelView } from "client/utils/label";
import type { Tree } from "./tree";
import type { DragSelectable } from "client/base/draggable";
import type { Control } from "client/base/control";
import type { JVertex, Memento, NodeId } from "shared/json";

//=================================================================
/**
 * {@link Vertex} is the control for the tree vertices.
 */
//=================================================================
export class Vertex extends Independent implements DragSelectable, LabelView, ISerializable<JVertex> {

	public readonly $tag: string;
	public readonly type = "Vertex";
	public readonly $priority: number = Infinity;

	public readonly id: NodeId;
	public readonly height = 0;
	public readonly width = 0;

	/**
	 * The movement of {@link Vertex Vertices} does not concerns the Core,
	 * so we directly made it a {@link shallowRef}.
	 */
	@shallowRef public override accessor _location: IPoint;

	/**
	 * Several UI depends on this value, so it is reactive.
	 */
	@shallowRef public accessor $degree: number = 0;

	@shallowRef public accessor $dist: number = 0;

	@shallowRef public accessor $height: number = 0;

	private readonly _tree: Tree;
	private readonly _dot: SmoothGraphics;
	public readonly $label: Label;

	/**
	 * See {@link JVertex.isNew}.
	 * This state is carried on in generating {@link Memento}.
	 */
	public $isNew: boolean;

	constructor(tree: Tree, json: JVertex) {
		const sheet = tree.$sheet;
		super(sheet);
		this._tree = tree;

		this.$tag = "v" + json.id;
		this.id = json.id;
		this.$isNew = json.isNew || false;
		this._location = { x: json.x, y: json.y };
		this.name = json.name;

		this._dot = this.$addRootObject(new ScaledSmoothGraphics(), sheet.$layers[Layer.vertex]);
		this.$setupHit(this._dot, new Circle(0, 0, style.vertex.size * 2));

		this.$label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.label]);

		this.$reactDraw(this._draw, this._drawLabel);
	}

	public toJSON(): JVertex {
		return {
			id: this.id,
			name: this.name,
			x: this._location.x,
			y: this._location.y,
		};
	}

	public $toMemento(): Memento {
		const json = this.toJSON();
		json.isNew = this.$isNew;
		return [this.$tag, json];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@field public accessor name: string;

	public async addLeaf(length: number): Promise<void> {
		if(length > this.maxNewLeafLength) return;
		await this._tree.$vertices.$addLeaf(this, length);
	}

	public get isLeaf(): boolean {
		return !this.$destructed && this.$degree === 1;
	}

	public get cannotAdd(): boolean {
		return !this.$destructed && this._tree.$vertices.$isMaximal;
	}

	public get maxNewLeafLength(): number {
		if(this.$destructed) return 1;
		return MAX_TREE_HEIGHT - this.$dist;
	}

	public get isDeletable(): boolean {
		return !this.$destructed && !this._tree.isMinimal && this.$degree <= 2;
	}

	public async delete(): Promise<void> {
		if(this.$degree === 1) await this._tree.$vertices.$delete([this]);
		if(this.$degree === 2) await this._tree.$vertices.$join(this);
	}

	public goToDual(): void {
		this._tree.$goToDual([this]);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Control methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $anchor(): IPoint {
		return this._location;
	}

	public override $constrainBy(v: IPoint): IPoint {
		return constrainVertex(p => this._sheet.grid.$constrain(p), this._location, v);
	}

	public override $selectableWith(c: Control): boolean {
		return c instanceof Vertex;
	}

	public $testGrid(grid: Grid): boolean {
		return grid.$contains(this._location);
	}

	public override $anchors(): IPoint[] {
		return [this._location];
	}

	protected override async _move(x: number, y: number): Promise<void> {
		await super._move(x, y);
		if(this.$isNew) {
			const layout = this._tree.$project.design.layout;
			const flap = layout.$flaps.$sync.get(this.id);
			if(!flap) {
				this.$isNew = false;
			} else {
				const p = getRelativePoint(this._location, this._sheet, layout.$sheet);
				return flap.$sync(p);
			}
		}
		// If we get here, the Core will not be invoked, and we need to flush the history manually.
		return pendingFlush ||= Promise.resolve().then(() => {
			pendingFlush = undefined;
			this.$project.history.$flush();
		});
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
			.drawCircle(this._location.x, this._location.y, size / s)
			.endFill();
	}

	private _draw(): void {
		this.$drawDot(this._dot);
		const s = ProjectService.scale.value;
		this._dot.hitArea = new Circle(this._location.x * s, this._location.y * s, style.vertex.size * 2);
	}

	private _drawLabel(): void {
		this.$label.$color = this.$selected ? style.vertex.selected : undefined;
		this.$label.$draw(this.name, this._location.x, this._location.y);
	}
}

/**
 * If only established vertices are moving, the Core is not invoked,
 * and the history can be flushed right away. We use this {@link Promise}
 * to control the flushing.
 */
let pendingFlush: Promise<void> | undefined;
