import { shallowRef } from "vue";
import { Graphics } from "@pixi/graphics";
import { Matrix } from "@pixi/core";
import { Container } from "@pixi/display";
import { Text } from "@pixi/text";

import { View } from "client/base/view";
import ProjectService from "client/services/projectService";
import { Layer } from "client/shared/layers";
import { style } from "client/services/styleService";
import { drawPath, fillContours } from "client/utils/contourUtil";
import { getStripeTexture } from "client/utils/stripeTexture";
import { ScaledSmoothGraphics } from "client/utils/scaledSmoothGraphics";
import { BLACK, WHITE } from "client/shared/constant";

import type { Layout } from "./layout";
import type { HealthReport, UnsolvedQuadrant } from "core/design/health";

/**
 * The text marking the unsolved quadrants.
 *
 * The full-width question mark (U+FF1F) looks slightly better on Windows
 * Chrome, but its appearance depends much more on the available CJK fonts, so
 * we use the half-width one for consistency across environments.
 */
const UNSOLVED_MARK = "?";

const HALF = 0.5;

//=================================================================
/**
 * {@link Health} manages the design health check of a {@link Layout}.
 *
 * The check is performed on demand, as it is mostly for beginners. Once
 * enabled, it is performed again whenever the layout changes, until
 * disabled.
 */
//=================================================================
export class Health extends View {

	private readonly _layout: Layout;

	private readonly _enabled = shallowRef(false);
	public get enabled(): boolean { return this._enabled.value; }
	public set enabled(v: boolean) {
		this._enabled.value = v;
		if(!v) this._report.value = null;
	}

	private readonly _report = shallowRef<HealthReport | null>(null);

	/** The latest result, or `null` if not enabled or not ready yet. */
	public get report(): HealthReport | null { return this._report.value; }

	private readonly _uncovered: Graphics;
	private readonly _rivers: Graphics;
	private readonly _issues: ScaledSmoothGraphics;
	private readonly _marks: Container;

	/** Whether a check is in progress. */
	private _checking: boolean = false;

	/** Whether another check is needed after the current one. */
	private _dirty: boolean = false;

	constructor(layout: Layout) {
		super();
		this._layout = layout;
		const layers = layout.$sheet.$layers;
		this._uncovered =
			this.$addRootObject(new Graphics(), layers[Layer.uncovered]);
		this._rivers =
			this.$addRootObject(new Graphics(), layers[Layer.uncovered]);
		this._issues = this.$addRootObject(
			new ScaledSmoothGraphics(), layers[Layer.issue]
		);
		this._marks =
			this.$addRootObject(new Container(), layers[Layer.issue]);

		this.$reactDraw(
			this._watch, this._drawUncovered, this._drawRivers,
			this._drawIssues, this._drawMarks
		);
	}

	/**
	 * Perform the check again if enabled.
	 *
	 * As the layout could change rapidly (during dragging, for example), at
	 * most one check is in progress at any time, and the changes made in the
	 * meantime are covered by one more check after it.
	 */
	public async $check(): Promise<void> {
		if(!this.enabled) return;
		if(this._checking) {
			this._dirty = true;
			return;
		}
		this._checking = true;
		this._dirty = false;
		try {
			const border = this._layout.$sheet.grid.$getBorderPath();
			const core = this._layout.$project.$core;
			const report = await core.design.health(border);
			if(this.enabled) this._report.value = report;
		} finally {
			this._checking = false;
			if(this._dirty) this.$check();
		}
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Check upon enabling, and when the sheet changes (which doesn't
	 * involve the Core).
	 */
	private _watch(): void {
		if(!this.enabled) return;
		// Track the border explicitly, as it might not be read in $check.
		this._layout.$sheet.grid.$getBorderPath();
		this.$check();
	}

	private _drawUncovered(): void {
		const graphics = this._uncovered;
		graphics.clear();
		graphics.alpha = style.uncovered.alpha;
		const contours = this.report?.geometry?.uncovered;
		if(contours) fillContours(graphics, contours, style.uncovered.color);
	}

	/** Fill the unnatural rivers with stripes. */
	private _drawRivers(): void {
		const graphics = this._rivers;
		graphics.clear();
		const rivers = this.report?.geometry?.missingRiverRidges;
		if(!rivers) return;

		// The texture is in pixels, while the sheet is in grid units, so
		// we scale the texture down to keep the stripes in constant width.
		const s = ProjectService.scale.value;
		const fill = {
			texture: getStripeTexture(),
			color: style.hinge.color,
			alpha: style.shade.alpha,
			matrix: new Matrix(1 / s, 0, 0, 1 / s),
		};
		for(const { contours } of rivers) {
			for(const contour of contours) {
				graphics.beginTextureFill(fill);
				drawPath(graphics, contour.outer);
				graphics.endFill();
				if(!contour.inner) continue;
				graphics.beginHole();
				for(const inner of contour.inner) drawPath(graphics, inner);
				graphics.endHole();
			}
		}
	}

	private _drawIssues(): void {
		const graphics = this._issues;
		graphics.clear();
		const geometry = this.report?.geometry;
		if(!geometry) return;

		const { alpha, minRadius } = style.danglingRidge;
		const scale = ProjectService.scale.value;
		const radius = Math.max(style.danglingRidge.radius, minRadius / scale);
		graphics.beginFill(style.ridge.color, alpha);
		for(const p of geometry.danglingRidgeEnds) {
			graphics.drawCircle(p.x, p.y, radius);
		}
		graphics.endFill();
	}

	/** Mark the unsolved quadrants with question marks. */
	private _drawMarks(): void {
		const container = this._marks;
		for(const child of container.removeChildren()) {
			child.destroy({ children: true });
		}
		const quadrants = this.report?.unsolvedQuadrants;
		if(!quadrants) return;
		const s = ProjectService.scale.value;
		for(const quadrant of quadrants) {
			container.addChild(createMark(quadrant, s));
		}
	}
}

/**
 * Create a question mark in the same way as {@link Label}, but with fixed
 * colors (black glow and white fill).
 * @param s The scale of the sheet.
 */
function createMark(quadrant: UnsolvedQuadrant, s: number): Container {
	// The font size is in pixels, so that the text is rendered sharply.
	const size = quadrant.radius * style.unsolvedMark.size;
	const fontSize = Math.max(1, Math.round(size * s));
	const glow = new Text(UNSOLVED_MARK, {
		fill: BLACK,
		fontSize,
		stroke: BLACK,
		strokeThickness: style.label.glow * 2,
		lineJoin: "bevel",
	});
	const label = new Text(UNSOLVED_MARK, {
		fill: WHITE,
		fontSize,
		stroke: WHITE,
		strokeThickness: 1,
	});
	glow.anchor.set(HALF);
	label.anchor.set(HALF);

	const mark = new Container();
	mark.addChild(glow, label);
	mark.position.set(quadrant.centroid.x, quadrant.centroid.y);
	// The sheet is flipped vertically, so is the mark.
	const scale = size / fontSize;
	mark.scale.set(scale, -scale);
	return mark;
}
