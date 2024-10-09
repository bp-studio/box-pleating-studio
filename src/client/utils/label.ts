import { Container } from "@pixi/display";
import { Text } from "@pixi/text";

import ProjectService, { MIN_SCALE } from "client/services/projectService";
import { shallowRef } from "client/shared/decorators";
import { MARGIN_FIX } from "client/shared/constant";
import { Direction } from "shared/types/direction";
import { style } from "client/services/styleService";

import type { Control } from "client/base/control";
import type { IDestroyOptions } from "@pixi/display";
import type { Rectangle } from "@pixi/math";
import type { Sheet } from "client/project/components/sheet";

const TIMEOUT = 10;
const SQRT = 2 / Math.sqrt(MIN_SCALE);

const TEXT_WIDTH_LIMIT = 50;
const SMOOTHNESS = 2;
const HALF = 0.5;

export interface LabelView extends Control {
	$label: Label;
}

//=================================================================
/**
 * {@link Label} derives from {@link Container} in Pixi.
 * It is the standard of drawing text labels.
 */
//=================================================================
export class Label extends Container {

	private readonly _sheet: Sheet;
	private readonly _label: Text = new Text();
	private readonly _glow: Text = new Text();

	/**
	 * Scale-independent rendered width of the label.
	 * This depends only on the {@link $text}.
	 */
	@shallowRef private accessor _labelWidth: number = 0;

	@shallowRef private accessor _labelBounds: Rectangle = null!;

	private _contentCache: string = "";
	@shallowRef private accessor _directionCache: Direction = Direction.none;
	@shallowRef private accessor _xCache: number = 0;

	public $color?: number;
	public $distance: number = 1;

	constructor(sheet: Sheet) {
		super();
		this._sheet = sheet;
		sheet.$labels.add(this);

		this.addChild(this._glow);
		this.addChild(this._label);
		this._label.anchor.set(HALF);
		this._glow.anchor.set(HALF);
	}

	public override destroy(options?: boolean | IDestroyOptions | undefined): void {
		this._sheet.$labels.delete(this);
		super.destroy(options);
	}

	/**
	 * Draw a text label.
	 * @param text The string content of the text
	 * @param x The reference coordinate.
	 * @param y The reference coordinate.
	 * @param direction Drawing direction (if omitted, it will be decided by the grid)
	 */
	public $draw(text: string, x: number, y: number, direction?: Direction): void {
		// Setup text
		text = text.trim();
		this.visible = Boolean(text);
		const dir = this.visible ? this._draw(text, x, y, direction) : Direction.none;

		if(this._contentCache != text || this._directionCache != dir || this._xCache != x) {
			this._contentCache = text;
			let width = text == "" ? 0 : Math.ceil(this._label.width) / SMOOTHNESS;
			if(directionalOffsets[dir].x === 0) width /= 2;
			const bounds = this._label.getLocalBounds().clone();

			// Delay the following to avoid circular references.
			registerUpdate(() => {
				this._directionCache = dir;
				this._labelWidth = width;
				this._labelBounds = bounds;
				this._xCache = x;
			});
		}
	}

	/** The core method of drawing text. */
	private _draw(text: string, x: number, y: number, direction?: Direction): Direction {
		this._label.text = text;
		this._glow.text = text;

		// Rough positioning
		const s = ProjectService.scale.value;
		this.scale = { x: 1 / s / SMOOTHNESS, y: -1 / s / SMOOTHNESS };
		this.x = x;
		this.y = y;
		const factor = Math.sqrt(ProjectService.shrink.value);
		this._label.scale.set(factor);
		this._glow.scale.set(factor);

		// Label is an outer container that aligns _glow and _label at the center.
		// However upon positioning we need to align by the _label instead of the larger outer frame,
		// so we need to fix the calculated sizes.
		const outerBounds = this.getLocalBounds();
		const innerBounds = this._label.getLocalBounds();
		const innerWidth = innerBounds.width * factor;
		const xFix = (outerBounds.width - innerWidth) / 2;
		const yFix = (outerBounds.height - innerBounds.height * factor) / 2;

		// Decide position
		direction ??= this._sheet.grid.$getLabelDirection(x, y);
		if(direction != Direction.T && direction != Direction.none && innerWidth > TEXT_WIDTH_LIMIT) {
			// We don't allow texts that are too long to be placed sidewise.
			direction = Direction.B;
		}
		const offset = directionalOffsets[direction];
		const FONT_SIZE = style.label.size;
		this.pivot.set(
			-(Math.sign(offset.x) * (innerWidth / 2 - xFix) + offset.x * this.$distance),
			Math.sign(offset.y) * (FONT_SIZE * SMOOTHNESS - yFix) + offset.y * this.$distance
		);

		// Decide colors
		const fill = this.$color ?? style.label.color;
		const stroke = style.label.border;
		this._label.style = {
			fill,
			fontSize: FONT_SIZE * SMOOTHNESS,
			stroke: fill,
			strokeThickness: 1,
		};
		this._glow.style = {
			fill: stroke,
			fontSize: FONT_SIZE * SMOOTHNESS,
			stroke,
			strokeThickness: style.label.glow * SMOOTHNESS,
			lineJoin: "bevel",
		};

		return direction;
	}

	public get $text(): string {
		return this._label.text;
	}

	public get $offset(): IPoint {
		return { x: this.pivot.x / 2, y: this.pivot.y / 2 };
	}

	/** The horizontal overflow of a label, in pixels. This is determined by the actual rendering. */
	public get $overflow(): number {
		const bounds = this._labelBounds;
		if(!bounds || !this.visible) return 0;

		let result = 0;
		const x = this._xCache;
		const sheetWidth = this._sheet.grid.$renderWidth;
		const scale = ProjectService.scale.value;
		const factor = Math.sqrt(ProjectService.shrink.value);
		const left = x * scale + (bounds.left * factor - this.pivot.x) / SMOOTHNESS;
		const right = (x - sheetWidth) * scale + (bounds.right * factor - this.pivot.x) / SMOOTHNESS;

		if(left < 0) result = -left;
		if(right > 0) result = Math.max(result, right);

		return Math.ceil(result) + MARGIN_FIX;
	}

	/** Infer the proper scale under the current label by solving equations. */
	public $inferHorizontalScale(sheetWidth: number, fullWidth: number): number {
		const labelWidth = this._labelWidth;
		if(labelWidth == 0) return NaN;
		fullWidth -= Math.abs(directionalOffsets[this._directionCache].x) * 2 / SMOOTHNESS;
		const size = Math.abs(2 * this._xCache - sheetWidth);
		let result = solveEq(-fullWidth, labelWidth * SQRT, size);
		if(result > MIN_SCALE) {
			if(size != 0) result = (fullWidth - 2 * labelWidth) / size;
			else result = fullWidth / sheetWidth;
		}
		return result;
	}
}

/** Solve quadratic equations of the form o * x + s * Math.sqrt(x) + z == 0 */
function solveEq(z: number, s: number, o: number): number {
	if(o == 0) return z * z / (s * s); // Degenerated case
	const f = 2 * o * z, b = s * s - f;
	const det = b * b - f * f;
	return (b - Math.sqrt(det)) / (2 * o * o);
}

/**
 * Text offsets on each direction. Based on experience.
 */
const directionalOffsets: Record<Direction, IPoint> = {
	[Direction.UR]: { x: 12, y: 5 },
	[Direction.UL]: { x: -12, y: 5 },
	[Direction.LL]: { x: -12, y: -5 },
	[Direction.LR]: { x: 12, y: -5 },
	[Direction.T]: { x: 0, y: 7 },
	[Direction.L]: { x: -20, y: 0 },
	[Direction.B]: { x: 0, y: -7 },
	[Direction.R]: { x: 20, y: 0 },
	[Direction.none]: { x: 0, y: 0 },
};

let updatePending = false;
const updateQueue: Action[] = [];

function flushUpdate(): void {
	updatePending = false;
	for(const action of updateQueue) action();
	updateQueue.length = 0;
}

function registerUpdate(action: Action): void {
	updateQueue.push(action);
	if(!updatePending) {
		updatePending = true;
		setTimeout(flushUpdate, TIMEOUT);
	}
}
