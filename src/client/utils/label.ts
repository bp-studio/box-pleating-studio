import { Container } from "@pixi/display";
import { Text } from "@pixi/text";

import ProjectService from "client/services/projectService";
import { MARGIN, LABEL_MARGIN } from "client/shared/constant";
import { Direction } from "shared/types/direction";
import { style } from "client/services/styleService";
import { display } from "client/screen/display";

import type { Control } from "client/base/control";
import type { Grid } from "client/project/components/grid/grid";
import type { Sheet } from "client/project/components/sheet";

const FONT_SIZE = style.label.size;
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
 *
 * Labels are usually center-aligned and is placed below the reference points.
 * The exceptions are when the reference points are at the boundary of the sheet,
 * in which cases the labels could have different alignments and offsets.
 * (See {@link Grid.$getLabelDirection} and {@link directionalOffsets}.)
 *
 * When the labels are too wide and overflow beyond the viewport,
 * the old behavior is to reduce the calculated scale of the sheet
 * so that the labels are still fully in view.
 * This behavior, however, causes complicated dependencies and leads to
 * undesirable UX as the user drags labeled objects near the sheet boundary.
 * Therefore, since v0.7 we introduce the new behavior,
 * in which the overflow labels are pushed inwards so that the scale of
 * the sheet depends only on the sizes of the grid and the viewport.
 */
//=================================================================
export class Label extends Container {

	private readonly _sheet: Sheet;
	private readonly _label: Text = new Text();
	private readonly _glow: Text = new Text();

	private _initialized: boolean = false;

	public $color?: number;
	public $distance: number = 1;

	constructor(sheet: Sheet) {
		super();
		this._sheet = sheet;

		this.addChild(this._glow);
		this.addChild(this._label);
		this._label.anchor.set(HALF);
		this._glow.anchor.set(HALF);
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
		if(!this.visible) return;

		this._label.text = text;
		this._glow.text = text;

		this._positioning(x, y, direction);
		this._coloring();

		// For some unknown reason, PIXI could calculate the wrong bound during the first rendering.
		// To fix the issue, we setup a timeout and redraw the label.
		if(!this._initialized) {
			registerInitialization(() => this._positioning(x, y, direction));
			this._initialized = true;
		}
	}

	public get $text(): string {
		return this._label.text;
	}

	public get $offset(): IPoint {
		return { x: this.pivot.x / 2, y: this.pivot.y / 2 };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Setup the position of the label. */
	private _positioning(x: number, y: number, direction?: Direction): void {
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
		if(direction != Direction.none && innerWidth > TEXT_WIDTH_LIMIT) {
			// We don't allow texts that are too long to be placed sidewise.
			direction = fallbackDirection(direction);
		}
		const offset = directionalOffsets[direction];
		const pivot: Writeable<IPoint> = {
			x: -(Math.sign(offset.x) * (innerWidth / 2 - xFix) + offset.x * this.$distance),
			y: Math.sign(offset.y) * (FONT_SIZE * SMOOTHNESS - yFix) + offset.y * this.$distance,
		};

		// This part is the new logic since v0.7
		// Fix the pivot and push the label inwards if there is overflow.
		const sheetWidth = this._sheet.grid.$renderWidth;
		const left = x * s + (innerBounds.left * factor - pivot.x) / SMOOTHNESS;
		const right = (x - sheetWidth) * s + (innerBounds.right * factor - pivot.x) / SMOOTHNESS;
		const horMargin = Math.max((display.viewport.width - sheetWidth * s) / 2, MARGIN);
		const leftOverflow = left + horMargin - LABEL_MARGIN;
		const rightOverflow = right - horMargin + LABEL_MARGIN;
		if(rightOverflow > 0) pivot.x += rightOverflow * SMOOTHNESS;
		if(leftOverflow < 0) pivot.x += leftOverflow * SMOOTHNESS;

		this.pivot.set(pivot.x, pivot.y);
	}

	/** Decide colors. */
	private _coloring(): void {
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
	}
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

function fallbackDirection(dir: Direction): Direction {
	switch(dir) {
		case Direction.UR:
		case Direction.UL:
		case Direction.T:
			return Direction.T;
		default:
			return Direction.B;
	}
}

let initializationPending = false;
const initializationQueue: Action[] = [];
const INIT_TIMEOUT = 10;

function flushInitialization(): void {
	initializationPending = false;
	for(const action of initializationQueue) action();
	initializationQueue.length = 0;
}

function registerInitialization(action: Action): void {
	initializationQueue.push(action);
	if(!initializationPending) {
		initializationPending = true;
		setTimeout(flushInitialization, INIT_TIMEOUT);
	}
}
