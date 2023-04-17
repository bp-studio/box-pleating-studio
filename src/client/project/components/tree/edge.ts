import { computed } from "vue";
import { Polygon } from "@pixi/core";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Control } from "client/base/control";
import { Layer } from "client/shared/layers";
import ProjectService from "client/services/projectService";
import { shallowRef } from "client/shared/decorators";
import { Label } from "client/utils/label";
import { Direction } from "shared/types/direction";
import { style } from "client/services/styleService";

import type { SmoothGraphicsLike } from "client/utils/contourUtil";
import type { LabelView } from "client/utils/label";
import type { JEdge } from "shared/json";
import type { Tree } from "./tree";
import type { Vertex } from "./vertex";

const HIT_WIDTH = 5;
const LABEL_DISTANCE = 0.5;

//=================================================================
/**
 * {@link Edge} is the control of an edge in the tree.
 */
//=================================================================
export class Edge extends Control implements LabelView, ISerializable<JEdge> {

	public readonly $tag: string;
	public readonly type = "Edge";
	public readonly $priority: number = 0;

	@shallowRef private _length: number;

	public readonly $v1: Vertex;
	public readonly $v2: Vertex;

	public readonly $label: Label;
	private readonly _tree: Tree;
	private readonly _line: SmoothGraphics = new SmoothGraphics();

	constructor(tree: Tree, v1: Vertex, v2: Vertex, length: number) {
		const sheet = tree.$sheet;
		super(sheet);
		this._tree = tree;
		this.$selectedCursor = "pointer";

		this.$tag = `e${v1.id},${v2.id}`;
		this.$v1 = v1;
		this.$v2 = v2;
		this._length = length;

		this.$setupHit(this._line);
		this.$addRootObject(this._line, sheet.$layers[Layer.$edge]);

		this.$label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);
		this.$label.$distance = LABEL_DISTANCE;

		this.$reactDraw(this._draw, this._hitArea, this._drawLabel);
	}

	public toJSON(): JEdge {
		return {
			n1: this.$v1.id,
			n2: this.$v2.id,
			length: this._length,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Proxy properties
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get length(): number {
		return this._length;
	}
	public set length(v: number) {
		if(v < 1) return;
		this._length = v;
		this._tree.$updateLength([this.toJSON()]);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public split(): void {
		this._tree.$split(this);
	}

	public deleteAndMerge(): void {
		this._tree.$merge(this);
	}

	public delete(): void {
		const v = this.$getLeaf();
		if(v) this._tree.$delete([v]);
	}

	public get isRiver(): boolean {
		return !this.$getLeaf();
	}

	public get isDeletable(): boolean {
		return !this._tree.isMinimal;
	}

	public goToDual(): void {
		this._tree.$goToDual(this);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $getLeaf(): Vertex | undefined {
		if(this.$v1.isLeaf) return this.$v1;
		if(this.$v2.isLeaf) return this.$v2;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $drawLine(graphics: SmoothGraphicsLike): void {
		const { x1, x2, y1, y2 } = this._coordinates.value;
		const sh = ProjectService.shrink.value;
		graphics.clear()
			.lineStyle(
				(this.$hovered || this.$selected ? style.edge.hover : style.edge.width) * sh,
				this.$selected ? style.edge.selected : style.edge.color
			)
			.moveTo(x1, y1)
			.lineTo(x2, y2);
	}

	private _draw(): void {
		this.$drawLine(this._line);
	}

	private _drawLabel(): void {
		const { x1, x2, y1, y2 } = this._coordinates.value;
		const dir = getDirectionOfSlope((y2 - y1) / (x2 - x1));
		this.$label.$color = this.$selected ? style.edge.selected : undefined;
		this.$label.$draw(this.length.toString(), (x1 + x2) / 2, (y1 + y2) / 2, dir);
	}

	private _hitArea(): void {
		const { x1, x2, y1, y2 } = this._coordinates.value;

		// Update hit area
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
		const { x: x1, y: y1 } = this.$v1.$location;
		const { x: x2, y: y2 } = this.$v2.$location;
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
